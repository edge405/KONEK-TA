from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from apps.messaging.models import Conversation, Message, GroupChat
from apps.groups.models import Group, GroupMembership

User = get_user_model()


class ConversationAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='Password123!')
        self.user2 = User.objects.create_user(username='user2', password='Password123!')
        self.user3 = User.objects.create_user(username='user3', password='Password123!')
        self.token1, _ = Token.objects.get_or_create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        self.list_url = reverse('conversation-list')

    def test_create_conversation(self):
        response = self.client.post(self.list_url, {'other_user_id': self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        conv = Conversation.objects.get(id=response.data['id'])
        self.assertIn(self.user1, conv.participants.all())
        self.assertIn(self.user2, conv.participants.all())

    def test_list_conversations(self):
        conv = Conversation.objects.create()
        conv.participants.add(self.user1, self.user2)

        # Another conversation not involving user1
        conv_other = Conversation.objects.create()
        conv_other.participants.add(self.user2, self.user3)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], conv.id)

    def test_create_duplicate_conversation_returns_existing(self):
        # First creation
        res1 = self.client.post(self.list_url, {'other_user_id': self.user2.id})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        conv_id = res1.data['id']

        # Duplicate request
        res2 = self.client.post(self.list_url, {'other_user_id': self.user2.id})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['id'], conv_id)

    def test_create_conversation_nonexistent_user(self):
        response = self.client.post(self.list_url, {'other_user_id': 99999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MessageAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='Password123!')
        self.user2 = User.objects.create_user(username='user2', password='Password123!')
        self.intruder = User.objects.create_user(username='intruder', password='Password123!')
        
        self.token1, _ = Token.objects.get_or_create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')

        self.conv = Conversation.objects.create()
        self.conv.participants.add(self.user1, self.user2)
        self.messages_url = reverse('message-list', kwargs={'conversation_id': self.conv.id})
        self.read_url = reverse('mark-messages-read', kwargs={'conversation_id': self.conv.id})

    def test_send_message(self):
        payload = {'content': 'Hello from user1'}
        response = self.client.post(self.messages_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Hello from user1')
        self.assertTrue(Message.objects.filter(conversation=self.conv, content='Hello from user1').exists())

    def test_list_messages(self):
        Message.objects.create(conversation=self.conv, sender=self.user1, content='Message 1')
        Message.objects.create(conversation=self.conv, sender=self.user2, content='Message 2')
        response = self.client.get(self.messages_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['content'], 'Message 1')
        self.assertEqual(results[1]['content'], 'Message 2')

    def test_non_participant_cannot_send(self):
        intruder_token, _ = Token.objects.get_or_create(user=self.intruder)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {intruder_token.key}')
        response = self.client.post(self.messages_url, {'content': 'Intruder message'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_mark_messages_read(self):
        # user2 sends a message
        msg = Message.objects.create(conversation=self.conv, sender=self.user2, content='Unread msg', is_read=False)
        self.assertFalse(msg.is_read)

        # user1 marks messages as read
        response = self.client.post(self.read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        msg.refresh_from_db()
        self.assertTrue(msg.is_read)


class GroupChatAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin_user', password='Password123!')
        self.member = User.objects.create_user(username='group_member', password='Password123!')
        self.outsider = User.objects.create_user(username='outsider', password='Password123!')

        self.group = Group.objects.create(
            name='Developer Chat',
            description='Group discussions',
            admin=self.admin
        )
        GroupMembership.objects.create(user=self.admin, group=self.group, role='admin')
        GroupMembership.objects.create(user=self.member, group=self.group, role='member')

        self.member_token, _ = Token.objects.get_or_create(user=self.member)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')
        self.chat_url = reverse('group-chat', kwargs={'group_id': self.group.id})

    def test_send_group_chat_message(self):
        payload = {'content': 'Hello dev team!'}
        response = self.client.post(self.chat_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Hello dev team!')
        self.assertTrue(GroupChat.objects.filter(group=self.group, content='Hello dev team!').exists())

    def test_list_group_chat_messages(self):
        GroupChat.objects.create(group=self.group, sender=self.member, content='First chat msg')
        response = self.client.get(self.chat_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['content'], 'First chat msg')

    def test_non_member_cannot_send(self):
        outsider_token, _ = Token.objects.get_or_create(user=self.outsider)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {outsider_token.key}')
        response = self.client.post(self.chat_url, {'content': 'Spam message'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
