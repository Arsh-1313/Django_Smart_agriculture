"""
URL patterns for Farm Management, Soil Details, and Farm Cultivation History.
"""

from django.urls import path
from farms.views import (
    FarmListCreateView,
    FarmDetailView,
    FarmSoilListCreateView,
    FarmLatestSoilView,
    SoilDetailView,
)
from crops.views import FarmCropHistoryView

urlpatterns = [
    path('', FarmListCreateView.as_view(), name='farm_list_create'),
    path('<str:farm_id>/', FarmDetailView.as_view(), name='farm_detail'),
    path('<str:farm_id>/soil/', FarmSoilListCreateView.as_view(), name='farm_soil_list_create'),
    path('<str:farm_id>/soil/latest/', FarmLatestSoilView.as_view(), name='farm_soil_latest'),
    path('<str:farm_id>/history/', FarmCropHistoryView.as_view(), name='farm_crop_history'),
    path('soil/<str:soil_id>/', SoilDetailView.as_view(), name='soil_detail'),
]
