from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """Allow only the owner of an object to edit/delete it."""

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "author"):
            return obj.author == request.user
        return obj == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow owners to edit, everyone else read-only."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "author"):
            return obj.author == request.user
        return False


class IsGroupAdmin(permissions.BasePermission):
    """Allow only group admins to modify group settings."""

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "admin"):
            return obj.admin == request.user
        if hasattr(obj, "group"):
            return obj.group.admin == request.user
        return False


class IsGroupMember(permissions.BasePermission):
    """Allow only group members to access group content."""

    def has_object_permission(self, request, view, obj):
        group = getattr(obj, "group", obj)
        return group.members.filter(id=request.user.id).exists()


class IsGroupAdminOrReadOnly(permissions.BasePermission):
    """Allow group admins to modify, members to read."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        group = getattr(obj, "group", obj)
        return group.admin == request.user
