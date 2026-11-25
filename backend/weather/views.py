"""
REST API Views for Weather and Geocoding.
"""

from rest_framework.views import APIView
from rest_framework import status
from common.permissions import IsAuthenticatedMongo
from common.utils import api_response, parse_object_id
from common.db import farms_col
from weather.services import (
    fetch_current_weather,
    fetch_forecast,
    search_geocode,
)


class CurrentWeatherView(APIView):
    """
    GET: Current meteorological telemetry. Accepts coordinates (lat, lon)
    or a farm_id to auto-resolve parcel coordinates.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        farm_id = request.query_params.get('farm_id')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        farm_oid = None
        if farm_id:
            farm_oid, err = parse_object_id(farm_id)
            if not err:
                farm = farms_col().find_one({"_id": farm_oid})
                if farm and 'location' in farm and 'coordinates' in farm['location']:
                    coords = farm['location']['coordinates']  # [lng, lat]
                    lon = coords[0]
                    lat = coords[1]

        if lat is None or lon is None:
            # Default to Central India coordinates if unspecified
            lat = 20.5937
            lon = 78.9629

        try:
            lat = float(lat)
            lon = float(lon)
        except ValueError:
            return api_response(success=False, message="Invalid coordinates.", status_code=status.HTTP_400_BAD_REQUEST)

        result = fetch_current_weather(lat, lon, farm_id=farm_oid)
        return api_response(success=True, data=result)


class ForecastWeatherView(APIView):
    """
    GET: 7-day agricultural weather forecast (temperatures, rain probabilities, wind).
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        farm_id = request.query_params.get('farm_id')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        days = int(request.query_params.get('days', 7))

        if farm_id:
            farm_oid, err = parse_object_id(farm_id)
            if not err:
                farm = farms_col().find_one({"_id": farm_oid})
                if farm and 'location' in farm and 'coordinates' in farm['location']:
                    coords = farm['location']['coordinates']
                    lon = coords[0]
                    lat = coords[1]

        if lat is None or lon is None:
            lat = 20.5937
            lon = 78.9629

        try:
            lat = float(lat)
            lon = float(lon)
        except ValueError:
            return api_response(success=False, message="Invalid coordinates.", status_code=status.HTTP_400_BAD_REQUEST)

        result = fetch_forecast(lat, lon, days=days)
        return api_response(success=True, data=result)


class GeocodeView(APIView):
    """
    GET: Search and resolve location names (villages, districts, cities) to GPS coordinates.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return api_response(success=True, data=[], message="Query must be at least 2 characters.")

        results = search_geocode(q)
        return api_response(success=True, data=results)
