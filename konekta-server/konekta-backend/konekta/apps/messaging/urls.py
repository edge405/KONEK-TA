from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('conversations/<int:conversation_id>/read/', views.mark_messages_read, name='mark-messages-read'),
    path('groups/<int:group_id>/chat/', views.GroupChatListView.as_view(), name='group-chat'),
]
