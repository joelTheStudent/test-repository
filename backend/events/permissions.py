from rest_framework import permissions
from .models import EventShare

class IsOwnerOrShared(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.owner == request.user:
            return True
        try:
            share = obj.shares.get(shared_with=request.user)
            if request.method in permissions.SAFE_METHODS:
                return True
            return share.permission == EventShare.EDIT
        except EventShare.DoesNotExist:
            return False

class IsEventOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
