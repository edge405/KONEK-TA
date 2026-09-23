from rest_framework import status, generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.db.models import Q
from django.utils import timezone
from .models import User, UserProfile, Follow, Block, Report
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserProfileSerializer, FollowSerializer, BlockSerializer, ReportSerializer,
    PasswordChangeSerializer, NotificationSettingsSerializer,
    PrivacySettingsSerializer, DeleteAccountSerializer,
)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully'})


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user



class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.exclude(id=self.request.user.id)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return queryset


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_toggle_view(request, user_id):
    if request.user.id == user_id:
        return Response(
            {'error': 'You cannot follow yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        user_to_follow = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=user_to_follow
    )
    if not created:
        follow.delete()
        return Response({'status': 'unfollowed', 'following': False})
    return Response({'status': 'followed', 'following': True})


class FollowersListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(following_set__following=self.request.user)


class FollowingListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(followers_set__follower=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def follow_status_view(request, user_id):
    is_following = Follow.objects.filter(
        follower=request.user,
        following_id=user_id
    ).exists()
    return Response({'is_following': is_following})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def block_toggle_view(request, user_id):
    if request.user.id == user_id:
        return Response({'error': 'You cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user_to_block = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    block, created = Block.objects.get_or_create(
        blocker=request.user,
        blocked=user_to_block
    )
    if not created:
        block.delete()
        return Response({'status': 'unblocked', 'blocked': False})
    return Response({'status': 'blocked', 'blocked': True})


class BlockedUsersView(generics.ListAPIView):
    serializer_class = BlockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Block.objects.filter(blocker=self.request.user).select_related('blocked').order_by('-created_at')


class ReportCreateView(generics.CreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_view(request):
    query = request.query_params.get('q', '')
    search_type = request.query_params.get('type', 'all')

    if not query:
        return Response({'users': [], 'groups': [], 'posts': []})

    results = {}

    if search_type in ('all', 'users'):
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).exclude(id=request.user.id)[:10]
        results['users'] = UserSerializer(users, many=True).data

    if search_type in ('all', 'groups'):
        from apps.groups.models import Group
        from apps.groups.serializers import GroupSerializer
        groups = Group.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )[:10]
        results['groups'] = GroupSerializer(groups, many=True, context={'request': request}).data

    if search_type in ('all', 'posts'):
        from apps.posts.models import Post
        from apps.posts.serializers import PostSerializer
        posts = Post.objects.filter(
            Q(content__icontains=query) & Q(visibility='public')
        ).select_related('author')[:10]
        results['posts'] = PostSerializer(posts, many=True, context={'request': request}).data

    return Response(results)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)


DEFAULT_NOTIFICATION_SETTINGS = {
    'email_notifications': True,
    'push_notifications': True,
    'notify_follows': True,
    'notify_likes': True,
    'notify_comments': True,
    'notify_messages': True,
}


class NotificationSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        merged = {**DEFAULT_NOTIFICATION_SETTINGS, **(profile.notification_settings or {})}
        return Response(merged, status=status.HTTP_200_OK)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = NotificationSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        current = {**DEFAULT_NOTIFICATION_SETTINGS, **(profile.notification_settings or {})}
        current.update(serializer.validated_data)
        profile.notification_settings = current
        profile.save()
        return Response(current, status=status.HTTP_200_OK)


DEFAULT_PRIVACY_SETTINGS = {
    'profile_visibility': 'public',
    'search_visibility': True,
}


class PrivacySettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        merged = {**DEFAULT_PRIVACY_SETTINGS, **(profile.privacy_settings or {})}
        return Response(merged, status=status.HTTP_200_OK)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = PrivacySettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        current = {**DEFAULT_PRIVACY_SETTINGS, **(profile.privacy_settings or {})}
        current.update(serializer.validated_data)
        profile.privacy_settings = current
        profile.save()
        return Response(current, status=status.HTTP_200_OK)


class DataExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        posts_data = [
            {
                'id': post.id,
                'content': post.content,
                'created_at': post.created_at.isoformat() if post.created_at else None,
                'likes_count': post.likes.count(),
                'comments_count': post.comments.count(),
            }
            for post in user.posts.all()
        ]
        comments_data = [
            {
                'id': comment.id,
                'post_id': comment.post_id,
                'content': comment.content,
                'created_at': comment.created_at.isoformat() if comment.created_at else None,
            }
            for comment in user.comments.all()
        ] if hasattr(user, 'comments') else []
        likes_data = list(user.likes.values_list('post_id', flat=True)) if hasattr(user, 'likes') else []
        groups_data = [
            {
                'id': gm.group.id,
                'name': gm.group.name,
                'role': gm.role,
                'joined_at': gm.joined_at.isoformat() if hasattr(gm, 'joined_at') and gm.joined_at else None,
            }
            for gm in user.memberships.select_related('group').all()
        ] if hasattr(user, 'memberships') else []
        following = list(user.following_set.values_list('following__username', flat=True))
        followers = list(user.followers_set.values_list('follower__username', flat=True))

        payload = {
            'export_date': timezone.now().isoformat(),
            'profile': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'bio': user.bio,
                'location': user.location,
                'website': user.website,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            },
            'posts': posts_data,
            'comments': comments_data,
            'likes': likes_data,
            'groups': groups_data,
            'following': following,
            'followers': followers,
        }
        res = Response(payload, status=status.HTTP_200_OK)
        res['Content-Disposition'] = f'attachment; filename="konekta_data_export_{user.username}.json"'
        return res


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.delete()
        return Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)

