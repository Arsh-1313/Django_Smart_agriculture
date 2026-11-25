"""
Automated unit tests for Weather and Geocoding APIs.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from common.db import users_col, farms_col


class WeatherTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        users_col().delete_many({})
        farms_col().delete_many({})

        # Register Farmer
        reg_res = self.client.post('/api/auth/register/', {
            "username": "weather_farmer",
            "email": "weather_farmer@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.token = reg_res.json()['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create farm
        f_res = self.client.post('/api/farms/', {
            "farm_name": "Weather Test Farm",
            "total_area_acres": 4.0,
            "latitude": 19.9975,
            "longitude": 73.7898,
            "village": "Trimbak",
            "district": "Nashik",
            "state": "Maharashtra",
            "irrigation_type": "drip"
        }, format='json')
        self.farm_id = f_res.json()['data']['id']

    def test_current_weather_with_coordinates(self):
        res = self.client.get('/api/weather/current/?lat=19.9975&lon=73.7898')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('temperature', data['data'])
        self.assertIn('humidity', data['data'])
        self.assertIn('weather_desc', data['data'])

    def test_current_weather_with_farm_id(self):
        res = self.client.get(f'/api/weather/current/?farm_id={self.farm_id}')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['latitude'], 19.9975)
        self.assertEqual(data['data']['longitude'], 73.7898)

    def test_forecast_weather(self):
        res = self.client.get(f'/api/weather/forecast/?farm_id={self.farm_id}&days=7')
        self.assertEqual(res.status_code, 200)
        data = res.json()['data']
        self.assertIn('forecast', data)
        self.assertGreaterEqual(len(data['forecast']), 7)
        first_day = data['forecast'][0]
        self.assertIn('temp_max', first_day)
        self.assertIn('temp_min', first_day)
        self.assertIn('precipitation_probability', first_day)

    def test_geocoding_search(self):
        res = self.client.get('/api/weather/geocode/?q=Nashik')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['data'], list)
