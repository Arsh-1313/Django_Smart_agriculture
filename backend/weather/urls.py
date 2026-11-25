"""
URL patterns for Weather and Geocoding APIs.
"""

from django.urls import path
from weather.views import (
    CurrentWeatherView,
    ForecastWeatherView,
    GeocodeView,
)

urlpatterns = [
    path('current/', CurrentWeatherView.as_view(), name='weather_current'),
    path('forecast/', ForecastWeatherView.as_view(), name='weather_forecast'),
    path('geocode/', GeocodeView.as_view(), name='weather_geocode'),
]
