from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.posts.models import Like, Comment
from apps.accounts.models import Follow
from apps.notifications.models import Notification


@receiver(post_save, sender=Like)
def create_like_notification(sender, instance, created, **kwargs):
    if created and instance.post.author != instance.user:
        Notification.objects.create(
            user=instance.post.author,
            notification_type='like',
            title='New Like',
            message=f'{instance.user.username} liked your post',
            related_user=instance.user,
        )


@receiver(post_save, sender=Comment)
def create_comment_notification(sender, instance, created, **kwargs):
    if created and instance.post.author != instance.user:
        Notification.objects.create(
            user=instance.post.author,
            notification_type='comment',
            title='New Comment',
            message=f'{instance.user.username} commented on your post',
            related_user=instance.user,
        )


@receiver(post_save, sender=Follow)
def create_follow_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.following,
            notification_type='follow',
            title='New Follower',
            message=f'{instance.follower.username} started following you',
            related_user=instance.follower,
        )
