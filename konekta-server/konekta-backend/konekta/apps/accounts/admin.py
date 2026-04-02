from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, Follow, Block, Report


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_verified', 'is_staff')
    list_filter = ('is_verified', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('bio', 'profile_picture', 'birth_date', 'location', 'website', 'is_verified')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username',)


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'following', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('follower__username', 'following__username')


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked', 'created_at')
    search_fields = ('blocker__username', 'blocked__username')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('reporter', 'reported_user', 'reason', 'status', 'created_at')
    list_filter = ('reason', 'status', 'created_at')
    search_fields = ('reporter__username', 'reported_user__username')
