"""
URL patterns for authentication and account management.
"""

from django.urls import path
from accounts.views import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    UserProfileView,
    LogoutView,
    AdminUsersListView,
    AdminUserStatusView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth_refresh'),
    path('profile/', UserProfileView.as_view(), name='auth_profile'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    # Admin User Management
    path('users/', AdminUsersListView.as_view(), name='admin_users_list'),
    path('users/<str:user_id>/status/', AdminUserStatusView.as_view(), name='admin_user_status'),
]
