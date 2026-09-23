from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from konekta.asgi import application
from apps.posts.models import Post, Like
from apps.notifications.models import Notification

User = get_user_model()


class NotificationConsumerTests(TransactionTestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='nuser1', email='nuser1@test.com', password='password123'
        )
        self.user2 = User.objects.create_user(
            username='nuser2', email='nuser2@test.com', password='password123'
        )
        self.token1 = Token.objects.create(user=self.user1)
        self.token2 = Token.objects.create(user=self.user2)

        self.post = Post.objects.create(author=self.user1, content="Hello World Post")

    async def test_unauthenticated_connection_rejected(self):
        communicator = WebsocketCommunicator(
            application, "/ws/notifications/"
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_authenticated_connection(self):
        communicator = WebsocketCommunicator(
            application, f"/ws/notifications/?token={self.token1.key}"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_broadcast_notification_on_like(self):
        communicator = WebsocketCommunicator(
            application, f"/ws/notifications/?token={self.token1.key}"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Trigger notification via signal by liking post
        await database_sync_to_async(
            lambda: Like.objects.create(post=self.post, user=self.user2)
        )()

        # User 1 should receive real-time notification
        notification_data = await communicator.receive_json_from(timeout=3)
        self.assertEqual(notification_data["notification_type"], "like")
        self.assertEqual(notification_data["title"], "New Like")
        self.assertIn("liked your post", notification_data["message"])

        await communicator.disconnect()
