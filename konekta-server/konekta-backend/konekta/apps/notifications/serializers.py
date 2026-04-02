from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    related_user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 'is_read', 
                 'related_user', 'created_at')
        read_only_fields = ('id', 'created_at')
