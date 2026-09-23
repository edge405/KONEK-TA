from rest_framework import generics, permissions, status, exceptions
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

    def create(self, request, *args, **kwargs):
        other_user_id = request.data.get('other_user_id')
        if not other_user_id:
            raise exceptions.ValidationError({"other_user_id": "other_user_id is required"})
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            raise exceptions.NotFound({"other_user_id": "User not found"})
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()
        
        if existing_conversation:
            serializer = self.get_serializer(existing_conversation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageListView(generics.ListCreateAPIView):
    """List and create messages in a conversation"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(conversation_id=conversation_id).select_related('sender')

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            raise exceptions.NotFound("Conversation not found")
        if self.request.user not in conversation.participants.all():
            raise exceptions.PermissionDenied("You are not a participant in this conversation")
        msg = serializer.save(conversation_id=conversation_id)
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"chat_{conversation_id}",
                    {
                        'type': 'chat_message',
                        'message': {
                            'id': msg.id,
                            'conversation': int(conversation_id),
                            'sender': msg.sender.username,
                            'content': msg.content,
                            'image': msg.image.url if msg.image else None,
                            'file': msg.file.url if msg.file else None,
                            'is_read': msg.is_read,
                            'created_at': msg.created_at.isoformat(),
                        }
                    }
                )
        except Exception:
            pass


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
            raise exceptions.PermissionDenied("You are not a member of this group")
        chat = serializer.save(group_id=group_id)
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"group_chat_{group_id}",
                    {
                        'type': 'group_chat_message',
                        'message': {
                            'id': chat.id,
                            'group': chat.group.name,
                            'group_id': int(group_id),
                            'sender': chat.sender.username,
                            'content': chat.content,
                            'image': chat.image.url if chat.image else None,
                            'file': chat.file.url if chat.file else None,
                            'created_at': chat.created_at.isoformat(),
                        }
                    }
                )
        except Exception:
            pass


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
