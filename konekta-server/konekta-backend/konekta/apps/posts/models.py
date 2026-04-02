from django.db import models
from django.contrib.auth import get_user_model
from apps.groups.models import Group

User = get_user_model()


class Post(models.Model):
    """Post model for user content"""
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('friends', 'Friends Only'),
        ('group', 'Group Members'),
        ('private', 'Private'),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='posts/images/', blank=True, null=True)
    video = models.FileField(upload_to='posts/videos/', blank=True, null=True)
    link_url = models.URLField(blank=True, null=True)
    link_title = models.CharField(max_length=200, blank=True)
    link_description = models.TextField(blank=True)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True, related_name='posts')
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}..."


class Like(models.Model):
    """Like model for posts"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']

    def __str__(self):
        return f"{self.user.username} likes {self.post.id}"


class Comment(models.Model):
    """Comment model for posts"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='replies')
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}..."


class Share(models.Model):
    """Share model for posts"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='shares')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']

    def __str__(self):
        return f"{self.user.username} shared {self.post.id}"
