import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message, GroupChat
from apps.groups.models import GroupMembership

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        is_participant = await self.check_participant(self.conversation_id, self.user)
        if not is_participant:
            await self.close(code=4003)
            return

        self.room_group_name = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action = data.get('action', 'message')

        if action == 'message' or 'content' in data:
            content = data.get('content', '').strip()
            if not content:
                return

            saved_msg = await self.save_message(self.conversation_id, self.user, content)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': saved_msg
                }
            )
        elif action == 'mark_read':
            await self.mark_messages_read(self.conversation_id, self.user)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt',
                    'reader': self.user.username,
                    'conversation_id': int(self.conversation_id),
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def check_participant(self, conversation_id, user):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            return conv.participants.filter(id=user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, conversation_id, user, content):
        msg = Message.objects.create(
            conversation_id=conversation_id,
            sender=user,
            content=content
        )
        return {
            'id': msg.id,
            'conversation': int(conversation_id),
            'sender': user.username,
            'content': msg.content,
            'image': None,
            'file': None,
            'is_read': False,
            'created_at': msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def mark_messages_read(self, conversation_id, user):
        Message.objects.filter(
            conversation_id=conversation_id,
            is_read=False
        ).exclude(sender=user).update(is_read=True)


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_id = self.scope['url_route']['kwargs']['group_id']
        is_member = await self.check_membership(self.group_id, self.user)
        if not is_member:
            await self.close(code=4003)
            return

        self.room_group_name = f"group_chat_{self.group_id}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        content = data.get('content', '').strip()
        if not content:
            return

        saved_msg = await self.save_group_message(self.group_id, self.user, content)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'group_chat_message',
                'message': saved_msg
            }
        )

    async def group_chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def check_membership(self, group_id, user):
        return GroupMembership.objects.filter(group_id=group_id, user=user).exists()

    @database_sync_to_async
    def save_group_message(self, group_id, user, content):
        chat = GroupChat.objects.create(
            group_id=group_id,
            sender=user,
            content=content
        )
        avatar_url = None
        if hasattr(user, 'profile_picture') and user.profile_picture:
            avatar_url = user.profile_picture.url

        full_name = f"{user.first_name} {user.last_name}".strip()
        sender_name = full_name if full_name else user.username

        return {
            'id': chat.id,
            'group': chat.group.name,
            'group_id': int(group_id),
            'sender': user.username,
            'sender_id': user.id,
            'sender_name': sender_name,
            'sender_avatar': avatar_url,
            'content': chat.content,
            'image': None,
            'file': None,
            'created_at': chat.created_at.isoformat(),
        }
