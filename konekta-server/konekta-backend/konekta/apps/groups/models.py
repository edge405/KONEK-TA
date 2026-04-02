from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Group(models.Model):
    """Interest-based groups"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    cover_image = models.ImageField(upload_to='groups/covers/', blank=True, null=True)
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='administered_groups')
    members = models.ManyToManyField(User, related_name='user_groups', through='GroupMembership')
    is_private = models.BooleanField(default=False)
    members_count = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    """Group membership with roles"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
        ('member', 'Member'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'group']

    def __str__(self):
        return f"{self.user.username} - {self.group.name} ({self.role})"


class GroupInvitation(models.Model):
    """Group invitations"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='invitations')
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    invitee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_invitations')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['group', 'invitee']

    def __str__(self):
        return f"Invitation to {self.group.name} for {self.invitee.username}"
