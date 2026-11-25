"""
URL patterns for Crops Catalog and History.
"""

from django.urls import path
from crops.views import (
    CropListView,
    CropDetailView,
    CropHistoryDetailView,
)

urlpatterns = [
    path('', CropListView.as_view(), name='crop_list_create'),
    path('<str:crop_id>/', CropDetailView.as_view(), name='crop_detail'),
    path('history/<str:history_id>/', CropHistoryDetailView.as_view(), name='crop_history_detail'),
]
