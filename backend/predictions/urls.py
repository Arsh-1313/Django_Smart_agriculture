"""
URL patterns for ML Predictions.
"""

from django.urls import path
from predictions.views import (
    CropPredictionView,
    YieldPredictionView,
    FertilizerPredictionView,
    PredictionHistoryView,
    DiseaseDetectionView,
    DiseaseHistoryView,
)

urlpatterns = [
    path('crop/', CropPredictionView.as_view(), name='predict_crop'),
    path('yield/', YieldPredictionView.as_view(), name='predict_yield'),
    path('fertilizer/', FertilizerPredictionView.as_view(), name='predict_fertilizer'),
    path('history/', PredictionHistoryView.as_view(), name='prediction_history'),
    path('disease/detect/', DiseaseDetectionView.as_view(), name='predict_disease'),
    path('disease/history/', DiseaseHistoryView.as_view(), name='disease_history'),
]
