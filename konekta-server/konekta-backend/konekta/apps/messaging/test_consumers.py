import json
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from konekta.asgi import application
from apps.messaging.models import Conversation, Message, GroupChat
from apps.groups.models import Group, GroupMembership

User = get_user_model()


class ChatConsumerTests(TransactionTestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1', email='user1@test.com', password='password123'
        )
        self.user2 = User.objects.create_user(
            username='user2', email='user2@test.com', password='password123'
        )
        self.user3 = User.objects.create_user(
            username='user3', email='user3@test.com', password='password123'
        )
        self.token1 = Token.objects.create(user=self.user1)
        self.token2 = Token.objects.create(user=self.user2)
        self.token3 = Token.objects.create(user=self.user3)

        self.conversation = Conversation.objects.create()
        self.conversation.participants.add(self.user1, self.user2)

    async def test_unauthenticated_connection_rejected(self):
        communicator = WebsocketCommunicator(
            application, f"/ws/chat/{self.conversation.id}/"
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_unauthorized_user_connection_rejected(self):
        communicator = WebsocketCommunicator(
            application, f"/ws/chat/{self.conversation.id}/?token={self.token3.key}"
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_chat_send_and_receive_message(self):
        communicator1 = WebsocketCommunicator(
            application, f"/ws/chat/{self.conversation.id}/?token={self.token1.key}"
        )
        communicator2 = WebsocketCommunicator(
            application, f"/ws/chat/{self.conversation.id}/?token={self.token2.key}"
        )

        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        # User 1 sends message
        await communicator1.send_json_to({
            "content": "Hello via WebSocket!"
        })

        # User 2 receives message
        response2 = await communicator2.receive_json_from(timeout=3)
        self.assertEqual(response2["content"], "Hello via WebSocket!")
        self.assertEqual(response2["sender"], "user1")

        # User 1 also receives confirmation / broadcast
        response1 = await communicator1.receive_json_from(timeout=3)
        self.assertEqual(response1["content"], "Hello via WebSocket!")

        # Verify message persisted in DB
        has_msg = await database_sync_to_async(
            lambda: Message.objects.filter(conversation=self.conversation, content="Hello via WebSocket!").exists()
        )()
        self.assertTrue(has_msg)

        await communicator1.disconnect()
        await communicator2.disconnect()


class GroupChatConsumerTests(TransactionTestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='guser1', email='guser1@test.com', password='password123'
        )
        self.user2 = User.objects.create_user(
            username='guser2', email='guser2@test.com', password='password123'
        )
        self.user3 = User.objects.create_user(
            username='guser3', email='guser3@test.com', password='password123'
        )
        self.token1 = Token.objects.create(user=self.user1)
        self.token2 = Token.objects.create(user=self.user2)
        self.token3 = Token.objects.create(user=self.user3)

        self.group = Group.objects.create(
            name='Test Group', admin=self.user1, is_private=False
        )
        GroupMembership.objects.create(user=self.user1, group=self.group, role='admin')
        GroupMembership.objects.create(user=self.user2, group=self.group, role='member')

    async def test_non_member_connection_rejected(self):
        communicator = WebsocketCommunicator(
            application, f"/ws/groups/{self.group.id}/chat/?token={self.token3.key}"
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_group_chat_send_and_receive(self):
        comm1 = WebsocketCommunicator(
            application, f"/ws/groups/{self.group.id}/chat/?token={self.token1.key}"
        )
        comm2 = WebsocketCommunicator(
            application, f"/ws/groups/{self.group.id}/chat/?token={self.token2.key}"
        )

        connected1, _ = await comm1.connect()
        connected2, _ = await comm2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        # Send group message
        await comm1.send_json_to({
            "content": "Hello Group!"
        })

        # Comm2 receives it
        resp2 = await comm2.receive_json_from(timeout=3)
        self.assertEqual(resp2["content"], "Hello Group!")
        self.assertEqual(resp2["sender"], "guser1")

        # Verify persisted in DB
        has_msg = await database_sync_to_async(
            lambda: GroupChat.objects.filter(group=self.group, content="Hello Group!").exists()
        )()
        self.assertTrue(has_msg)

        await comm1.disconnect()
        await comm2.disconnect()
