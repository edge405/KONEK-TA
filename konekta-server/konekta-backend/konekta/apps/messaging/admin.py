from django.contrib import admin
from .models import Conversation, Message, GroupChat


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('participants',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'conversation', 'content', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('content', 'sender__username')
    raw_id_fields = ('sender', 'conversation')


@admin.register(GroupChat)
class GroupChatAdmin(admin.ModelAdmin):
    list_display = ('sender', 'group', 'content', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'sender__username')
    raw_id_fields = ('sender', 'group')
