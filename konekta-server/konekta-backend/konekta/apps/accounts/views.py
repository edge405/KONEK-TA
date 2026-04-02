from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from django.db.models import Q
from .models import User, UserProfile, Follow, Block, Report
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserProfileSerializer, FollowSerializer, BlockSerializer, ReportSerializer,
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
        return Block.objects.filter(blocker=self.request.user).select_related('blocked')


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
