from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from apps.posts.models import Post, Like, Comment
from apps.accounts.models import Follow
from apps.notifications.models import Notification

User = get_user_model()


class NotificationSignalTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username='alice', password='Password123!')
        self.bob = User.objects.create_user(username='bob', password='Password123!')
        self.post = Post.objects.create(author=self.alice, content='Alice Post', visibility='public')

    def test_like_creates_notification(self):
        Like.objects.create(user=self.bob, post=self.post)
        notif = Notification.objects.filter(user=self.alice, notification_type='like').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.related_user, self.bob)
        self.assertEqual(notif.title, 'New Like')
        self.assertIn('bob liked your post', notif.message)

    def test_self_like_no_notification(self):
        Like.objects.create(user=self.alice, post=self.post)
        notifs = Notification.objects.filter(user=self.alice, notification_type='like')
        self.assertEqual(notifs.count(), 0)

    def test_comment_creates_notification(self):
        Comment.objects.create(user=self.bob, post=self.post, content='Nice post!')
        notif = Notification.objects.filter(user=self.alice, notification_type='comment').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.related_user, self.bob)
        self.assertEqual(notif.title, 'New Comment')

    def test_follow_creates_notification(self):
        Follow.objects.create(follower=self.bob, following=self.alice)
        notif = Notification.objects.filter(user=self.alice, notification_type='follow').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.related_user, self.bob)
        self.assertEqual(notif.title, 'New Follower')

    def test_group_invitation_creates_notification(self):
        from apps.groups.models import Group, GroupInvitation
        group = Group.objects.create(name='Tech Enthusiasts', admin=self.alice)
        GroupInvitation.objects.create(group=group, inviter=self.alice, invitee=self.bob)
        notif = Notification.objects.filter(user=self.bob, notification_type='group_invite').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.related_user, self.alice)
        self.assertEqual(notif.title, 'Group Invitation')
        self.assertIn('invited you to join Tech Enthusiasts', notif.message)

    def test_group_join_creates_notification(self):
        from apps.groups.models import Group, GroupMembership
        group = Group.objects.create(name='Designers Club', admin=self.alice)
        GroupMembership.objects.create(user=self.bob, group=group, role='member')
        notif = Notification.objects.filter(user=self.alice, notification_type='group_join').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.related_user, self.bob)
        self.assertEqual(notif.title, 'New Group Member')
        self.assertIn('bob joined Designers Club', notif.message)

    def test_direct_message_creates_notification(self):
        from apps.messaging.models import Conversation, Message
        conv = Conversation.objects.create()
        conv.participants.add(self.alice, self.bob)
        Message.objects.create(conversation=conv, sender=self.bob, content='Hey Alice!')
        notif = Notification.objects.filter(user=self.alice, notification_type='message').first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.related_user, self.bob)
        self.assertEqual(notif.title, 'New Message')
        self.assertIn('Hey Alice!', notif.message)


class NotificationEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='notif_user', password='Password123!')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        self.notif1 = Notification.objects.create(
            user=self.user,
            notification_type='like',
            title='Notification 1',
            message='First notification',
            is_read=False
        )
        self.notif2 = Notification.objects.create(
            user=self.user,
            notification_type='comment',
            title='Notification 2',
            message='Second notification',
            is_read=False
        )
        self.list_url = reverse('notification-list')

    def test_list_notifications(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)

    def test_mark_notification_read(self):
        url = reverse('mark-notification-read', kwargs={'notification_id': self.notif1.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)

    def test_mark_all_notifications_read(self):
        url = reverse('mark-all-notifications-read')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif1.refresh_from_db()
        self.notif2.refresh_from_db()
        self.assertTrue(self.notif1.is_read)
        self.assertTrue(self.notif2.is_read)
