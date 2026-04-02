from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Conversation, Message, GroupChat
from .serializers import ConversationSerializer, MessageSerializer, GroupChatSerializer

User = get_user_model()


class ConversationListView(generics.ListCreateAPIView):
    """List and create conversations"""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).prefetch_related('participants', 'messages')

    def perform_create(self, serializer):
        # Get the other participant from request data
        other_user_id = self.request.data.get('other_user_id')
        if not other_user_id:
            raise ValueError("other_user_id is required")
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            raise ValueError("User not found")
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            participants=self.request.user
        ).filter(
            participants=other_user
        ).first()
        
        if existing_conversation:
            return existing_conversation
        
        conversation = serializer.save()
        conversation.participants.add(self.request.user, other_user)
        return conversation


class MessageListView(generics.ListCreateAPIView):
    """List and create messages in a conversation"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(conversation_id=conversation_id).select_related('sender')

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = Conversation.objects.get(id=conversation_id)
        if self.request.user not in conversation.participants.all():
            raise permissions.PermissionDenied("You are not a participant in this conversation")
        serializer.save(conversation_id=conversation_id)


class GroupChatListView(generics.ListCreateAPIView):
    """List and create group chat messages"""
    serializer_class = GroupChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs.get('group_id')
        return GroupChat.objects.filter(group_id=group_id).select_related('sender', 'group')

    def perform_create(self, serializer):
        group_id = self.kwargs.get('group_id')
        # Check if user is a member of the group
        from apps.groups.models import GroupMembership
        try:
            GroupMembership.objects.get(user=self.request.user, group_id=group_id)
        except GroupMembership.DoesNotExist:
            raise permissions.PermissionDenied("You are not a member of this group")
        serializer.save(group_id=group_id)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_read(request, conversation_id):
    """Mark messages as read"""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        if request.user not in conversation.participants.all():
            return Response({'error': 'Not a participant'}, status=status.HTTP_403_FORBIDDEN)
        
        Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)
        
        return Response({'message': 'Messages marked as read'})
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
