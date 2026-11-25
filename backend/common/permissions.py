"""
Role-based permissions for Smart Agriculture Platform.
Roles: 'farmer', 'buyer', 'admin'.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAuthenticatedMongo(BasePermission):
    """Allows access only to authenticated MongoDB users."""
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, 'is_authenticated', False))


class IsFarmer(BasePermission):
    """Allows access only to users with role 'farmer' or 'admin'."""
    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, 'is_authenticated', False)):
            return False
        return getattr(request.user, 'role', '') in ('farmer', 'admin')


class IsBuyer(BasePermission):
    """Allows access only to users with role 'buyer' or 'admin'."""
    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, 'is_authenticated', False)):
            return False
        return getattr(request.user, 'role', '') in ('buyer', 'admin')


class IsAdmin(BasePermission):
    """Allows access strictly to users with role 'admin'."""
    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, 'is_authenticated', False)):
            return False
        return getattr(request.user, 'role', '') == 'admin'


class IsFarmerOrReadOnly(BasePermission):
    """Read-only access for anyone authenticated, write access restricted to farmers."""
    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, 'is_authenticated', False)):
            return False
        if request.method in SAFE_METHODS:
            return True
        return getattr(request.user, 'role', '') in ('farmer', 'admin')


class IsBuyerOrReadOnly(BasePermission):
    """Read-only access for anyone authenticated, write access restricted to buyers."""
    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, 'is_authenticated', False)):
            return False
        if request.method in SAFE_METHODS:
            return True
        return getattr(request.user, 'role', '') in ('buyer', 'admin')
