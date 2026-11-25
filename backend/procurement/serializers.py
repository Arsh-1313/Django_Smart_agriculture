"""
Serializers for Procurement Centres, Time Slots, and Farmer Delivery Bookings.
"""

from rest_framework import serializers


class ProcurementCentreSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    state = serializers.CharField(max_length=100)
    district = serializers.CharField(max_length=100)
    address = serializers.CharField(max_length=500)
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0)
    contact_phone = serializers.CharField(max_length=20)
    capacity_quintals = serializers.FloatField(min_value=10.0)
    commodities_accepted = serializers.ListField(
        child=serializers.CharField(max_length=100),
        default=list
    )
    operating_hours = serializers.CharField(max_length=100, default='08:00 AM - 05:00 PM')


class ProcurementSlotCreateSerializer(serializers.Serializer):
    slot_date = serializers.CharField(max_length=20)
    start_time = serializers.CharField(max_length=20)
    end_time = serializers.CharField(max_length=20)
    capacity_quintals = serializers.FloatField(min_value=1.0)


class BookingCreateSerializer(serializers.Serializer):
    centre_id = serializers.CharField(max_length=50)
    slot_id = serializers.CharField(max_length=50)
    crop_name = serializers.CharField(max_length=100)
    estimated_quantity_quintals = serializers.FloatField(min_value=0.1)
    vehicle_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class BookingStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['confirmed', 'completed', 'cancelled', 'no_show'])
    remarks = serializers.CharField(max_length=500, required=False, allow_blank=True)
