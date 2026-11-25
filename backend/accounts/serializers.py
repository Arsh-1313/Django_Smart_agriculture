"""
Authentication and Profile Serializers using Django REST Framework.
Validates input data for MongoDB documents.
"""

from rest_framework import serializers
from common.db import users_col


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=60, min_length=3, trim_whitespace=True)
    email = serializers.EmailField(trim_whitespace=True)
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)
    role = serializers.ChoiceField(choices=['farmer', 'buyer'], default='farmer')
    first_name = serializers.CharField(max_length=60, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=60, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')

    # Farmer profile fields (optional at registration)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    district = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    village = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    pin_code = serializers.CharField(max_length=10, required=False, allow_blank=True, default='')
    experience_years = serializers.IntegerField(required=False, default=0, min_value=0)
    preferred_language = serializers.CharField(max_length=30, required=False, default='English')

    # Buyer profile fields (optional at registration)
    business_name = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')
    business_type = serializers.ChoiceField(
        choices=['wholesaler', 'retailer', 'processor', 'individual'],
        required=False,
        default='wholesaler'
    )
    gst_or_license = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    delivery_address = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    city = serializers.CharField(max_length=80, required=False, allow_blank=True, default='')

    def validate_username(self, value):
        username = value.lower().strip()
        if users_col().find_one({"username": username}):
            raise serializers.ValidationError("A user with this username already exists.")
        return username

    def validate_email(self, value):
        email = value.lower().strip()
        if users_col().find_one({"email": email}):
            raise serializers.ValidationError("A user with this email address already exists.")
        return email

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField(required=True, trim_whitespace=True)
    password = serializers.CharField(required=True, write_only=True)


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True)


class ProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=60, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=60, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # Farmer fields
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    district = serializers.CharField(max_length=100, required=False, allow_blank=True)
    village = serializers.CharField(max_length=100, required=False, allow_blank=True)
    pin_code = serializers.CharField(max_length=10, required=False, allow_blank=True)
    experience_years = serializers.IntegerField(required=False, min_value=0)
    preferred_language = serializers.CharField(max_length=30, required=False, allow_blank=True)

    # Buyer fields
    business_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    business_type = serializers.ChoiceField(
        choices=['wholesaler', 'retailer', 'processor', 'individual'],
        required=False
    )
    gst_or_license = serializers.CharField(max_length=50, required=False, allow_blank=True)
    delivery_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=80, required=False, allow_blank=True)
