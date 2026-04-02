from django.contrib import admin
from .models import Group, GroupMembership, GroupInvitation


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin', 'is_private', 'members_count', 'posts_count', 'created_at')
    list_filter = ('is_private', 'created_at')
    search_fields = ('name', 'description')
    raw_id_fields = ('admin',)


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'group__name')


@admin.register(GroupInvitation)
class GroupInvitationAdmin(admin.ModelAdmin):
    list_display = ('group', 'inviter', 'invitee', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('group__name', 'inviter__username', 'invitee__username')
