from django.urls import path
from notifications.views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
)

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='list'),
    path('read-all/', NotificationMarkAllReadView.as_view(), name='mark_all_read'),
    path('<str:notification_id>/read/', NotificationMarkReadView.as_view(), name='mark_read'),
]
