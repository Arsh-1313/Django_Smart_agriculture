"""
REST API Views for In-App Notifications.
Provides endpoints for retrieving user notifications and managing read receipts.
"""

from rest_framework.views import APIView
from rest_framework import status
from common.permissions import IsAuthenticatedMongo
from common.utils import api_response
from notifications.services import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
)


class NotificationListView(APIView):
    """
    GET: List notifications for the authenticated user with unread counter.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        user_id = request.user.id
        unread_only = request.query_params.get('unread_only', 'false').lower() == 'true'
        limit = min(int(request.query_params.get('limit', 50)), 100)

        items, unread_count = get_user_notifications(user_id, limit=limit, unread_only=unread_only)
        return api_response(
            success=True,
            message="Notifications retrieved successfully.",
            data={
                "notifications": items,
                "unread_count": unread_count
            }
        )


class NotificationMarkReadView(APIView):
    """
    PUT: Marks a specific notification as read.
    """
    permission_classes = [IsAuthenticatedMongo]

    def put(self, request, notification_id):
        user_id = request.user.id
        success = mark_notification_as_read(notification_id, user_id)
        if not success:
            return api_response(
                success=False,
                message="Notification not found or already read.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return api_response(
            success=True,
            message="Notification marked as read."
        )


class NotificationMarkAllReadView(APIView):
    """
    PUT: Marks all notifications as read for the authenticated user.
    """
    permission_classes = [IsAuthenticatedMongo]

    def put(self, request):
        user_id = request.user.id
        updated_count = mark_all_notifications_as_read(user_id)
        return api_response(
            success=True,
            message=f"{updated_count} notification(s) marked as read.",
            data={"updated_count": updated_count}
        )
