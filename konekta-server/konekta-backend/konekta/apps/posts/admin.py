from django.contrib import admin
from .models import Post, Like, Comment, Share


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('author', 'content', 'visibility', 'likes_count', 'comments_count', 'created_at')
    list_filter = ('visibility', 'created_at')
    search_fields = ('content', 'author__username')
    raw_id_fields = ('author', 'group')


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')
    raw_id_fields = ('user', 'post')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'content', 'parent', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'user__username')
    raw_id_fields = ('user', 'post', 'parent')


@admin.register(Share)
class ShareAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')
    raw_id_fields = ('user', 'post')
