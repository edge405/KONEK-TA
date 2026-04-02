from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProfile, Follow, Block, Report


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        return attrs


class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'bio',
            'profile_picture', 'birth_date', 'location', 'website',
            'is_verified', 'followers_count', 'following_count', 'posts_count',
            'date_joined',
        )
        read_only_fields = ('id', 'date_joined', 'followers_count', 'following_count', 'posts_count')

    def get_followers_count(self, obj):
        return obj.followers_set.count()

    def get_following_count(self, obj):
        return obj.following_set.count()

    def get_posts_count(self, obj):
        return obj.posts.count()


class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'created_at')
        read_only_fields = ('id', 'follower', 'following', 'created_at')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'interests', 'privacy_settings', 'notification_settings')


class BlockSerializer(serializers.ModelSerializer):
    blocked_user = UserSerializer(source='blocked', read_only=True)

    class Meta:
        model = Block
        fields = ('id', 'blocked_user', 'created_at')
        read_only_fields = ('id', 'created_at')


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('id', 'reported_user', 'reason', 'description', 'status', 'created_at')
        read_only_fields = ('id', 'reporter', 'status', 'created_at')

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)
