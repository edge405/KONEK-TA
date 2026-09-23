from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message, GroupChat

User = get_user_model()


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.StringRelatedField(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'last_message', 'unread_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content,
                'sender': last_msg.sender.username,
                'created_at': last_msg.created_at
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'conversation', 'sender', 'content', 'image', 'file', 
                 'is_read', 'created_at')
        read_only_fields = ('id', 'conversation', 'sender', 'created_at')

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class GroupChatSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField(read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    group = serializers.StringRelatedField(read_only=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True)

    class Meta:
        model = GroupChat
        fields = ('id', 'group', 'group_id', 'sender', 'sender_id', 'sender_name', 'sender_avatar', 'content', 'image', 'file', 'created_at')
        read_only_fields = ('id', 'sender', 'sender_id', 'sender_name', 'sender_avatar', 'group', 'group_id', 'created_at')

    def get_sender_name(self, obj):
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name if name else obj.sender.username

    def get_sender_avatar(self, obj):
        request = self.context.get('request')
        if hasattr(obj.sender, 'profile_picture') and obj.sender.profile_picture:
            url = obj.sender.profile_picture.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)
