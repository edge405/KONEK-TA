from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model with additional fields"""
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    birth_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class Follow(models.Model):
    """Follow model for user relationships"""
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['follower', 'following']
        verbose_name = 'Follow'
        verbose_name_plural = 'Follows'

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class UserProfile(models.Model):
    """Additional user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    interests = models.JSONField(default=list, blank=True)
    privacy_settings = models.JSONField(default=dict, blank=True)
    notification_settings = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Block(models.Model):
    """Block model to prevent unwanted interactions"""
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['blocker', 'blocked']
        verbose_name = 'Block'
        verbose_name_plural = 'Blocks'

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"


class Report(models.Model):
    """Report model for flagging content"""
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('inappropriate', 'Inappropriate Content'),
        ('fake', 'Fake Account'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
    ]

    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='reports_received')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'

    def __str__(self):
        return f"Report by {self.reporter.username} - {self.reason}"
