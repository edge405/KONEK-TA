from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Like, Comment, Share

User = get_user_model()


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'author', 'content', 'image', 'video', 'link_url', 
                 'link_title', 'link_description', 'visibility', 'group', 
                 'likes_count', 'comments_count', 'shares_count', 'created_at', 
                 'updated_at', 'is_liked', 'is_shared')
        read_only_fields = ('id', 'author', 'likes_count', 'comments_count', 
                           'shares_count', 'created_at', 'updated_at')

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_shared(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.shares.filter(user=request.user).exists()
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('content', 'image', 'video', 'link_url', 'link_title', 
                 'link_description', 'visibility', 'group')

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ('id', 'user', 'post', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        like, created = Like.objects.get_or_create(**validated_data)
        if created:
            like.post.likes_count += 1
            like.post.save()
        return like


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'author', 'content', 'parent', 'likes_count', 
                 'created_at', 'updated_at', 'replies')
        read_only_fields = ('id', 'author', 'likes_count', 'created_at', 'updated_at')

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []


class ShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Share
        fields = ('id', 'user', 'post', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        share, created = Share.objects.get_or_create(**validated_data)
        if created:
            share.post.shares_count += 1
            share.post.save()
        return share
