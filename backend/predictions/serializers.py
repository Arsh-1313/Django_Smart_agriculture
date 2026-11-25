"""
Serializers for ML Prediction Endpoints.
"""

from rest_framework import serializers


class CropPredictionInputSerializer(serializers.Serializer):
    farm_id = serializers.CharField(required=False, allow_blank=True, default='')
    N = serializers.FloatField(min_value=0.0, required=True)
    P = serializers.FloatField(min_value=0.0, required=True)
    K = serializers.FloatField(min_value=0.0, required=True)
    temperature = serializers.FloatField(min_value=-10.0, max_value=60.0, required=True)
    humidity = serializers.FloatField(min_value=0.0, max_value=100.0, required=True)
    ph = serializers.FloatField(min_value=0.0, max_value=14.0, required=True)
    rainfall = serializers.FloatField(min_value=0.0, max_value=2000.0, required=True)


class YieldPredictionInputSerializer(serializers.Serializer):
    farm_id = serializers.CharField(required=False, allow_blank=True, default='')
    crop = serializers.CharField(max_length=60, required=True, trim_whitespace=True)
    state = serializers.CharField(max_length=60, required=True, trim_whitespace=True)
    season = serializers.ChoiceField(choices=['Kharif', 'Rabi', 'Whole Year'], default='Kharif')
    area_acres = serializers.FloatField(min_value=0.1, required=True)
    annual_rainfall_mm = serializers.FloatField(min_value=0.0, required=False, default=1000.0)
    fertilizer_kg_per_acre = serializers.FloatField(min_value=0.0, required=False, default=100.0)


class FertilizerPredictionInputSerializer(serializers.Serializer):
    farm_id = serializers.CharField(required=False, allow_blank=True, default='')
    nitrogen = serializers.FloatField(min_value=0.0, required=True)
    phosphorus = serializers.FloatField(min_value=0.0, required=True)
    potassium = serializers.FloatField(min_value=0.0, required=True)
    soil_type = serializers.CharField(max_length=50, required=False, default='Loamy')
    crop_type = serializers.CharField(max_length=50, required=False, default='Wheat')
    temperature = serializers.FloatField(required=False, default=26.0)
    humidity = serializers.FloatField(required=False, default=60.0)
    moisture = serializers.FloatField(required=False, default=35.0)
