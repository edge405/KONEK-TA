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


class GroupMembershipSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    group = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = GroupMembership
        fields = ('id', 'user', 'group', 'role', 'joined_at')
        read_only_fields = ('id', 'user', 'group', 'joined_at')


class GroupInvitationSerializer(serializers.ModelSerializer):
    inviter = serializers.StringRelatedField(read_only=True)
    group = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = GroupInvitation
        fields = ('id', 'group', 'inviter', 'invitee', 'status', 'message', 
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'inviter', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['inviter'] = self.context['request'].user
        return super().create(validated_data)
