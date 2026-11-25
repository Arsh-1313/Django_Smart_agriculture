"""
Serializers for Produce Marketplace Listings and Buyer Orders.
"""

from rest_framework import serializers


class ProductListingSerializer(serializers.Serializer):
    crop_name = serializers.CharField(max_length=100)
    variety = serializers.CharField(max_length=100, default='Standard')
    quantity_quintals = serializers.FloatField(min_value=0.1)
    price_per_quintal = serializers.FloatField(min_value=1.0)
    quality_grade = serializers.ChoiceField(
        choices=['Grade A', 'Grade B', 'Grade C', 'Organic'],
        default='Grade A'
    )
    harvest_date = serializers.CharField(max_length=50, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100)
    district = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    farm_id = serializers.CharField(max_length=50, required=False, allow_blank=True)


class OrderCreateSerializer(serializers.Serializer):
    listing_id = serializers.CharField(max_length=50)
    quantity_quintals = serializers.FloatField(min_value=0.1)
    delivery_address = serializers.CharField(max_length=500)
    contact_phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['accepted', 'shipped', 'delivered', 'cancelled']
    )
    remarks = serializers.CharField(max_length=500, required=False, allow_blank=True)
