"""
Automated unit and integration tests for Farm Management and Soil Details.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from common.db import users_col, farms_col, soil_details_col, crop_history_col


class FarmsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Clean collections
        users_col().delete_many({})
        farms_col().delete_many({})
        soil_details_col().delete_many({})
        crop_history_col().delete_many({})

        # Register Farmer 1
        f1_res = self.client.post('/api/auth/register/', {
            "username": "farmer_one",
            "email": "farmer1@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.farmer1_token = f1_res.json()['data']['access']

        # Register Farmer 2
        f2_res = self.client.post('/api/auth/register/', {
            "username": "farmer_two",
            "email": "farmer2@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.farmer2_token = f2_res.json()['data']['access']

    def test_farm_creation_and_listing(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer1_token}')

        # 1. Create a farm
        farm_payload = {
            "farm_name": "Godavari Green Acres",
            "total_area_acres": 6.5,
            "latitude": 19.9975,
            "longitude": 73.7898,
            "village": "Trimbak",
            "district": "Nashik",
            "state": "Maharashtra",
            "irrigation_type": "drip"
        }
        res = self.client.post('/api/farms/', farm_payload, format='json')
        self.assertEqual(res.status_code, 201)
        farm_data = res.json()['data']
        self.assertEqual(farm_data['farm_name'], 'Godavari Green Acres')
        self.assertEqual(farm_data['location']['coordinates'], [73.7898, 19.9975])
        farm_id = farm_data['id']

        # 2. List farms for farmer 1
        list_res = self.client.get('/api/farms/')
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.json()['data']), 1)

        # 3. Farmer 2 should see 0 farms
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer2_token}')
        f2_list_res = self.client.get('/api/farms/')
        self.assertEqual(f2_list_res.status_code, 200)
        self.assertEqual(len(f2_list_res.json()['data']), 0)

        # 4. Farmer 2 cannot access Farmer 1's farm
        detail_res = self.client.get(f'/api/farms/{farm_id}/')
        self.assertEqual(detail_res.status_code, 404)

    def test_farm_detail_and_update(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer1_token}')
        create_res = self.client.post('/api/farms/', {
            "farm_name": "Shri Krishna Agro",
            "total_area_acres": 4.0,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "village": "Baramati",
            "district": "Pune",
            "state": "Maharashtra",
            "irrigation_type": "borewell"
        }, format='json')
        farm_id = create_res.json()['data']['id']

        # Update farm
        update_res = self.client.put(f'/api/farms/{farm_id}/', {
            "farm_name": "Shri Krishna Organic Agro",
            "total_area_acres": 5.5,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "village": "Baramati",
            "district": "Pune",
            "state": "Maharashtra",
            "irrigation_type": "drip"
        }, format='json')
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()['data']['farm_name'], 'Shri Krishna Organic Agro')
        self.assertEqual(update_res.json()['data']['total_area_acres'], 5.5)

    def test_soil_record_creation_and_latest_retrieval(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer1_token}')
        create_res = self.client.post('/api/farms/', {
            "farm_name": "Soil Test Farm",
            "total_area_acres": 3.0,
            "latitude": 21.1458,
            "longitude": 79.0882,
            "village": "Umred",
            "district": "Nagpur",
            "state": "Maharashtra",
            "irrigation_type": "canal"
        }, format='json')
        farm_id = create_res.json()['data']['id']

        # Add initial soil test
        soil_payload = {
            "nitrogen_N": 85.0,
            "phosphorus_P": 42.0,
            "potassium_K": 38.0,
            "pH": 6.8,
            "soil_type": "black",
            "organic_carbon_percent": 0.65,
            "moisture_percent": 30.0
        }
        soil_res = self.client.post(f'/api/farms/{farm_id}/soil/', soil_payload, format='json')
        self.assertEqual(soil_res.status_code, 201)
        self.assertEqual(soil_res.json()['data']['pH'], 6.8)

        # Retrieve latest soil test
        latest_res = self.client.get(f'/api/farms/{farm_id}/soil/latest/')
        self.assertEqual(latest_res.status_code, 200)
        self.assertEqual(latest_res.json()['data']['nitrogen_N'], 85.0)

    def test_farm_deletion_cascades(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer1_token}')
        create_res = self.client.post('/api/farms/', {
            "farm_name": "Temporary Farm",
            "total_area_acres": 2.0,
            "latitude": 20.0,
            "longitude": 75.0,
            "village": "V1",
            "district": "D1",
            "state": "S1",
            "irrigation_type": "rainfed"
        }, format='json')
        farm_id = create_res.json()['data']['id']

        # Add a soil record
        self.client.post(f'/api/farms/{farm_id}/soil/', {
            "nitrogen_N": 50.0, "phosphorus_P": 30.0, "potassium_K": 20.0, "pH": 7.0, "soil_type": "loamy"
        }, format='json')

        # Delete the farm
        del_res = self.client.delete(f'/api/farms/{farm_id}/')
        self.assertEqual(del_res.status_code, 200)

        # Farm should no longer exist
        get_res = self.client.get(f'/api/farms/{farm_id}/')
        self.assertEqual(get_res.status_code, 404)
