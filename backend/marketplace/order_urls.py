"""
URL patterns for Buyer Purchase Orders.
"""

from django.urls import path
from marketplace.views import (
    OrderListCreateView,
    OrderDetailView,
    OrderStatusUpdateView,
)

app_name = 'orders'

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order_list_create'),
    path('<str:order_id>/', OrderDetailView.as_view(), name='order_detail'),
    path('<str:order_id>/status/', OrderStatusUpdateView.as_view(), name='order_status_update'),
]
