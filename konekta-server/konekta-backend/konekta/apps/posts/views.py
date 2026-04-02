from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Post, Like, Comment, Share
from .serializers import PostSerializer, PostCreateSerializer, LikeSerializer, CommentSerializer, ShareSerializer


class PostListView(generics.ListCreateAPIView):
    """List and create posts"""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        user = self.request.user
        following_users = user.following_set.values_list('following_id', flat=True)
        return Post.objects.filter(
            Q(visibility='public') |
            Q(author=user) |
            Q(author_id__in=following_users) |
            Q(group__members=user)
        ).select_related('author', 'group').prefetch_related('likes', 'shares')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete posts"""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        following_users = user.following_set.values_list('following_id', flat=True)
        return Post.objects.filter(
            Q(visibility='public') |
            Q(author=user) |
            Q(author_id__in=following_users) |
            Q(group__members=user)
        )

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own posts")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own posts")
        instance.delete()


class PostLikeView(generics.CreateAPIView):
    """Like/unlike posts"""
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        post_id = kwargs.get('post_id')
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            post.likes_count -= 1
            post.save()
            return Response({'message': 'Post unliked'})
        else:
            post.likes_count += 1
            post.save()
            return Response({'message': 'Post liked'})


class CommentListView(generics.ListCreateAPIView):
    """List and create comments for a post"""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return Comment.objects.filter(post_id=post_id, parent=None).select_related('author')

    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        serializer.save(user=self.request.user, post_id=post_id)


class PostShareView(generics.CreateAPIView):
    """Share posts"""
    serializer_class = ShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        post_id = kwargs.get('post_id')
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        share, created = Share.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({'message': 'Post already shared'})
        else:
            post.shares_count += 1
            post.save()
            return Response({'message': 'Post shared'})
