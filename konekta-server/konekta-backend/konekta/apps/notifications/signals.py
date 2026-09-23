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


def broadcast_notification(notification):
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        data = {
            'id': notification.id,
            'notification_type': notification.notification_type,
            'title': notification.title,
            'message': notification.message,
            'is_read': notification.is_read,
            'related_user': notification.related_user.username if notification.related_user else None,
            'created_at': notification.created_at.isoformat(),
        }
        async_to_sync(channel_layer.group_send)(
            f"notifications_{notification.user_id}",
            {
                'type': 'notification_message',
                'notification': data,
            }
        )
    except Exception:
        pass


@receiver(post_save, sender=Notification)
def on_notification_created(sender, instance, created, **kwargs):
    if created:
        broadcast_notification(instance)

