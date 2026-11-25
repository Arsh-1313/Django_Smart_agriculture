"""
Automated unit and integration tests for Crops Catalog and Cultivation History.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from common.db import users_col, crops_col, crop_history_col, farms_col
from crops.management.commands.seed_crops import Command as SeedCropsCommand


class CropsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        users_col().delete_many({})
        crops_col().delete_many({})
        crop_history_col().delete_many({})
        farms_col().delete_many({})

        # Seed standard crops
        SeedCropsCommand().handle()

        # Register Farmer
        f_res = self.client.post('/api/auth/register/', {
            "username": "crop_farmer",
            "email": "farmer_crop@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.farmer_token = f_res.json()['data']['access']

        # Register Admin
        admin_doc = {
            "username": "superadmin",
            "email": "superadmin@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "admin"
        }
        # Directly insert admin in DB
        from common.authentication import hash_password
        admin_user_id = users_col().insert_one({
            "username": "superadmin",
            "email": "superadmin@agri.org",
            "password_hash": hash_password("Password@123"),
            "role": "admin",
            "is_active": True
        }).inserted_id
        admin_user = users_col().find_one({"_id": admin_user_id})
        from common.authentication import generate_tokens_for_user
        self.admin_token = generate_tokens_for_user(admin_user)['access']

    def test_crop_catalog_browsing_and_filtering(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')

        # 1. Fetch all seeded crops
        res = self.client.get('/api/crops/')
        self.assertEqual(res.status_code, 200)
        crops = res.json()['data']
        self.assertGreaterEqual(len(crops), 20)

        # 2. Filter by category = 'pulse'
        pulse_res = self.client.get('/api/crops/?category=pulse')
        self.assertEqual(pulse_res.status_code, 200)
        pulses = pulse_res.json()['data']
        self.assertTrue(all(c['category'] == 'pulse' for c in pulses))

        # 3. Search by name query = 'rice'
        search_res = self.client.get('/api/crops/?q=rice')
        self.assertEqual(search_res.status_code, 200)
        self.assertEqual(len(search_res.json()['data']), 1)
        self.assertEqual(search_res.json()['data'][0]['name'], 'Rice')

    def test_admin_can_add_crop_farmer_cannot(self):
        crop_payload = {
            "name": "Soybean",
            "category": "oilseed",
            "ideal_temp_min": 20.0,
            "ideal_temp_max": 30.0,
            "ideal_rainfall_min": 500.0,
            "ideal_rainfall_max": 900.0,
            "growing_period_days": 100
        }

        # Farmer attempt should be forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')
        forbidden_res = self.client.post('/api/crops/', crop_payload, format='json')
        self.assertEqual(forbidden_res.status_code, 403)

        # Admin attempt should succeed
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        admin_res = self.client.post('/api/crops/', crop_payload, format='json')
        self.assertEqual(admin_res.status_code, 201)
        self.assertEqual(admin_res.json()['data']['name'], 'Soybean')

    def test_farm_cultivation_history_lifecycle(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')

        # 1. Create a farm
        farm_res = self.client.post('/api/farms/', {
            "farm_name": "History Test Land",
            "total_area_acres": 10.0,
            "latitude": 19.5,
            "longitude": 74.5,
            "village": "Sangamner",
            "district": "Ahmednagar",
            "state": "Maharashtra",
            "irrigation_type": "canal"
        }, format='json')
        farm_id = farm_res.json()['data']['id']

        # 2. Record planting cycle
        history_payload = {
            "crop_name": "Wheat",
            "season": "Rabi",
            "year": 2025,
            "planted_area_acres": 5.0,
            "status": "planted",
            "notes": "HD-2967 certified high yield variety sown."
        }
        rec_res = self.client.post(f'/api/farms/{farm_id}/history/', history_payload, format='json')
        self.assertEqual(rec_res.status_code, 201)
        history_id = rec_res.json()['data']['id']
        self.assertEqual(rec_res.json()['data']['status'], 'planted')

        # 3. List cultivation history
        list_res = self.client.get(f'/api/farms/{farm_id}/history/')
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.json()['data']), 1)

        # 4. Update status to harvested with yield
        update_res = self.client.put(f'/api/crops/history/{history_id}/', {
            "crop_name": "Wheat",
            "season": "Rabi",
            "year": 2025,
            "planted_area_acres": 5.0,
            "harvested_yield_quintals": 125.0,
            "status": "harvested",
            "notes": "Harvested successfully with 25 quintals per acre."
        }, format='json')
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()['data']['status'], 'harvested')
        self.assertEqual(update_res.json()['data']['harvested_yield_quintals'], 125.0)
