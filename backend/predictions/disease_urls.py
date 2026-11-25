"""
URL patterns for Leaf Disease Detection API.
"""

from django.urls import path
from predictions.views import (
    DiseaseDetectionView,
    DiseaseHistoryView,
)

urlpatterns = [
    path('detect/', DiseaseDetectionView.as_view(), name='disease_detect'),
    path('history/', DiseaseHistoryView.as_view(), name='disease_history'),
]
