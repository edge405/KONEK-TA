from django.db import models
from django.contrib.auth import get_user_model
from apps.groups.models import Group

User = get_user_model()


class Conversation(models.Model):
    """Private conversations between users"""
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    """Messages in conversations"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    image = models.ImageField(upload_to='messages/images/', blank=True, null=True)
    file = models.FileField(upload_to='messages/files/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}..."


class GroupChat(models.Model):
    """Group chat messages"""
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='chats')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_messages')
    content = models.TextField()
    image = models.ImageField(upload_to='group_chats/images/', blank=True, null=True)
    file = models.FileField(upload_to='group_chats/files/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} in {self.group.name}: {self.content[:30]}..."
