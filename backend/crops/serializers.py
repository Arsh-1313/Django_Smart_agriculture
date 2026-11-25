"""
Serializers for Master Crops Catalog and Farmer Cultivation History.
"""

from rest_framework import serializers
from datetime import date
from common.db import crops_col


class CropSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80, trim_whitespace=True)
    category = serializers.ChoiceField(
        choices=['cereal', 'pulse', 'vegetable', 'fruit', 'oilseed', 'cash_crop'],
        default='cereal'
    )
    ideal_temp_min = serializers.FloatField(required=False, default=15.0)
    ideal_temp_max = serializers.FloatField(required=False, default=35.0)
    ideal_rainfall_min = serializers.FloatField(required=False, default=300.0)
    ideal_rainfall_max = serializers.FloatField(required=False, default=1500.0)
    ideal_ph_min = serializers.FloatField(required=False, default=5.5)
    ideal_ph_max = serializers.FloatField(required=False, default=7.5)
    growing_period_days = serializers.IntegerField(required=False, default=120, min_value=1)
    description = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_name(self, value):
        name = value.strip().capitalize()
        # In updates this might differ, but for creation uniqueness is enforced
        return name


class CropHistorySerializer(serializers.Serializer):
    crop_id = serializers.CharField(required=False, allow_blank=True, default='')
    crop_name = serializers.CharField(max_length=80, trim_whitespace=True)
    season = serializers.ChoiceField(choices=['Kharif', 'Rabi', 'Zaid'], default='Kharif')
    year = serializers.IntegerField(min_value=2000, max_value=2100)
    planted_area_acres = serializers.FloatField(min_value=0.01)
    harvested_yield_quintals = serializers.FloatField(min_value=0.0, required=False, default=0.0)
    status = serializers.ChoiceField(choices=['planted', 'harvested', 'failed'], default='planted')
    planting_date = serializers.DateField(required=False, default=date.today)
    harvest_date = serializers.DateField(required=False, allow_null=True, default=None)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
