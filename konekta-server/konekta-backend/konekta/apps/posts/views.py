from rest_framework import generics, permissions, status, exceptions
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from apps.accounts.models import Block
from .models import Post, Like, Comment, Share, HiddenPost, Bookmark
from .serializers import PostSerializer, PostCreateSerializer, LikeSerializer, CommentSerializer, ShareSerializer, BookmarkSerializer


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

        # Exclude blocked users (both ways)
        blocked_pairs = Block.objects.filter(
            Q(blocker=user) | Q(blocked=user)
        ).values_list('blocker_id', 'blocked_id')
        blocked_ids = set()
        for blocker_id, blocked_id in blocked_pairs:
            blocked_ids.add(blocker_id)
            blocked_ids.add(blocked_id)
        blocked_ids.discard(user.id)

        # Exclude posts hidden by current user
        hidden_post_ids = user.hidden_posts.values_list('post_id', flat=True)

        queryset = Post.objects.filter(
            Q(visibility='public') |
            Q(author=user) |
            Q(author_id__in=following_users) |
            Q(group__members=user)
        ).exclude(
            author_id__in=blocked_ids
        ).exclude(
            id__in=hidden_post_ids
        ).select_related('author', 'group').prefetch_related('likes', 'shares')

        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)

        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)

        return queryset


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
            raise exceptions.PermissionDenied("You can only edit your own posts")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise exceptions.PermissionDenied("You can only delete your own posts")
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
        return Comment.objects.filter(post_id=post_id, parent=None).select_related('user')

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


class PostHideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'not_interested')
        hidden, created = HiddenPost.objects.get_or_create(
            user=request.user,
            post=post,
            defaults={'reason': reason}
        )
        return Response({'message': 'Post hidden from feed', 'hidden': True}, status=status.HTTP_200_OK)

    def delete(self, request, post_id):
        try:
            hidden = HiddenPost.objects.get(user=request.user, post_id=post_id)
            hidden.delete()
            return Response({'message': 'Post unhidden', 'hidden': False}, status=status.HTTP_200_OK)
        except HiddenPost.DoesNotExist:
            return Response({'message': 'Post was not hidden', 'hidden': False}, status=status.HTTP_200_OK)


class BookmarkListView(generics.ListAPIView):
    """List bookmarked posts of the authenticated user"""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(
            bookmarked_by__user=self.request.user
        ).order_by('-bookmarked_by__created_at').select_related('author', 'group').prefetch_related('likes', 'shares', 'bookmarked_by')


class PostBookmarkView(APIView):
    """Toggle bookmarking a post"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            bookmark.delete()
            return Response({'message': 'Post removed from bookmarks', 'bookmarked': False}, status=status.HTTP_200_OK)
        return Response({'message': 'Post bookmarked', 'bookmarked': True}, status=status.HTTP_200_OK)

