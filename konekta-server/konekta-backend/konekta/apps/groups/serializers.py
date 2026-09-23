from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, GroupMembership, GroupInvitation

User = get_user_model()


class GroupSerializer(serializers.ModelSerializer):
    admin = serializers.StringRelatedField(read_only=True)
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'cover_image', 'admin', 'is_private', 
                 'members_count', 'posts_count', 'created_at', 'updated_at', 
                 'is_member', 'user_role')
        read_only_fields = ('id', 'admin', 'members_count', 'posts_count', 
                           'created_at', 'updated_at')

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = GroupMembership.objects.get(user=request.user, group=obj)
                return membership.role
            except GroupMembership.DoesNotExist:
                return None
        return None


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('name', 'description', 'cover_image', 'is_private')

    def create(self, validated_data):
        validated_data['admin'] = self.context['request'].user
        group = super().create(validated_data)
        # Add admin as first member
        GroupMembership.objects.create(
            user=group.admin,
            group=group,
            role='admin'
        )
        return group


class GroupMembershipUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'profile_picture')


class GroupMembershipSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_details = GroupMembershipUserSerializer(source='user', read_only=True)
    group = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = GroupMembership
        fields = ('id', 'user', 'user_details', 'group', 'role', 'joined_at')
        read_only_fields = ('id', 'user', 'user_details', 'group', 'joined_at')


class GroupInvitationGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'cover_image', 'members_count', 'is_private')


class GroupInvitationSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    group_details = GroupInvitationGroupSerializer(source='group', read_only=True)
    inviter = serializers.StringRelatedField(read_only=True)
    inviter_details = GroupMembershipUserSerializer(source='inviter', read_only=True)
    invitee = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    invitee_details = GroupMembershipUserSerializer(source='invitee', read_only=True)

    class Meta:
        model = GroupInvitation
        fields = (
            'id', 'group', 'group_details', 'inviter', 'inviter_details',
            'invitee', 'invitee_details', 'status', 'message',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'inviter', 'status', 'created_at', 'updated_at')

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        group = attrs.get('group')
        invitee = attrs.get('invitee')

        if user and group:
            if not GroupMembership.objects.filter(group=group, user=user).exists():
                raise serializers.ValidationError({"group": "You must be a member of the group to invite others."})

        if group and invitee:
            if GroupMembership.objects.filter(group=group, user=invitee).exists():
                raise serializers.ValidationError({"invitee": "This user is already a member of the group."})

            existing_invite = GroupInvitation.objects.filter(group=group, invitee=invitee).first()
            if existing_invite:
                if existing_invite.status == 'pending':
                    raise serializers.ValidationError({"invitee": "An invitation for this user is already pending."})
                elif existing_invite.status in ('declined', 'accepted'):
                    existing_invite.delete()

        return attrs

    def create(self, validated_data):
        validated_data['inviter'] = self.context['request'].user
        return super().create(validated_data)
