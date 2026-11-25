"""
Serializers for Farms and Soil Details using PyMongo document structures.
"""

from rest_framework import serializers
from datetime import date
from common.utils import parse_object_id
from common.db import farms_col


class FarmCreateUpdateSerializer(serializers.Serializer):
    farm_name = serializers.CharField(max_length=120, trim_whitespace=True)
    total_area_acres = serializers.FloatField(min_value=0.1)
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0)
    village = serializers.CharField(max_length=100, trim_whitespace=True)
    district = serializers.CharField(max_length=100, trim_whitespace=True)
    state = serializers.CharField(max_length=100, trim_whitespace=True)
    pin_code = serializers.CharField(max_length=10, required=False, allow_blank=True, default='')
    irrigation_type = serializers.ChoiceField(
        choices=['drip', 'canal', 'borewell', 'rainfed', 'sprinkler'],
        default='borewell'
    )


class SoilDetailSerializer(serializers.Serializer):
    nitrogen_N = serializers.FloatField(min_value=0.0, required=True)
    phosphorus_P = serializers.FloatField(min_value=0.0, required=True)
    potassium_K = serializers.FloatField(min_value=0.0, required=True)
    pH = serializers.FloatField(min_value=0.0, max_value=14.0, required=True)
    soil_type = serializers.ChoiceField(
        choices=['alluvial', 'black', 'clay', 'loamy', 'red', 'sandy'],
        default='loamy'
    )
    organic_carbon_percent = serializers.FloatField(min_value=0.0, max_value=100.0, required=False, default=0.5)
    moisture_percent = serializers.FloatField(min_value=0.0, max_value=100.0, required=False, default=25.0)
    recorded_date = serializers.DateField(required=False, default=date.today)
