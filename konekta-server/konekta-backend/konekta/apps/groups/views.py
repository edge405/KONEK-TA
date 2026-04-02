from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Group, GroupMembership, GroupInvitation
from .serializers import GroupSerializer, GroupCreateSerializer, GroupMembershipSerializer, GroupInvitationSerializer


class GroupListView(generics.ListCreateAPIView):
    """List and create groups"""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GroupCreateSerializer
        return GroupSerializer

    def get_queryset(self):
        queryset = Group.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        return queryset.select_related('admin').prefetch_related('members')


class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete groups"""
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Group.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        if serializer.instance.admin != self.request.user:
            raise permissions.PermissionDenied("Only group admin can update the group")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.admin != self.request.user:
            raise permissions.PermissionDenied("Only group admin can delete the group")
        instance.delete()


class GroupJoinView(generics.CreateAPIView):
    """Join a group"""
    serializer_class = GroupMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        group_id = kwargs.get('group_id')
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

        if group.is_private:
            return Response({'error': 'This group is private'}, status=status.HTTP_403_FORBIDDEN)

        membership, created = GroupMembership.objects.get_or_create(
            user=request.user,
            group=group,
            defaults={'role': 'member'}
        )

        if created:
            group.members_count += 1
            group.save()
            return Response({'message': 'Successfully joined the group'})
        else:
            return Response({'message': 'Already a member of this group'})


class GroupLeaveView(generics.DestroyAPIView):
    """Leave a group"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        group_id = kwargs.get('group_id')
        try:
            group = Group.objects.get(id=group_id)
            membership = GroupMembership.objects.get(user=request.user, group=group)
            if membership.role == 'admin':
                return Response({'error': 'Admin cannot leave the group'}, status=status.HTTP_403_FORBIDDEN)
            membership.delete()
            group.members_count -= 1
            group.save()
            return Response({'message': 'Successfully left the group'})
        except (Group.DoesNotExist, GroupMembership.DoesNotExist):
            return Response({'error': 'Group or membership not found'}, status=status.HTTP_404_NOT_FOUND)


class GroupMembersView(generics.ListAPIView):
    """List group members"""
    serializer_class = GroupMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs.get('group_id')
        return GroupMembership.objects.filter(group_id=group_id).select_related('user')


class GroupInvitationView(generics.ListCreateAPIView):
    """List and create group invitations"""
    serializer_class = GroupInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GroupInvitation.objects.filter(invitee=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_invitation(request, invitation_id):
    """Accept a group invitation"""
    try:
        invitation = GroupInvitation.objects.get(id=invitation_id, invitee=request.user)
        if invitation.status != 'pending':
            return Response({'error': 'Invitation already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.status = 'accepted'
        invitation.save()
        
        # Add user to group
        GroupMembership.objects.get_or_create(
            user=request.user,
            group=invitation.group,
            defaults={'role': 'member'}
        )
        
        invitation.group.members_count += 1
        invitation.group.save()
        
        return Response({'message': 'Invitation accepted'})
    except GroupInvitation.DoesNotExist:
        return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)
