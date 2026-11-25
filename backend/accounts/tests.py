"""
Automated unit and integration tests for Authentication, JWT, and MongoDB operations.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import path
from common.db import users_col, farmer_profiles_col, buyer_profiles_col, notifications_col
from common.permissions import IsFarmer, IsBuyer, IsAdmin, IsAuthenticatedMongo


# Mock test views to verify permission classes
class MockFarmerOnlyView(APIView):
    permission_classes = [IsFarmer]
    def get(self, request):
        return Response({"message": "Farmer access granted"})


class MockBuyerOnlyView(APIView):
    permission_classes = [IsBuyer]
    def get(self, request):
        return Response({"message": "Buyer access granted"})


class MockAdminOnlyView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request):
        return Response({"message": "Admin access granted"})


class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Clean collections before each test run
        users_col().delete_many({})
        farmer_profiles_col().delete_many({})
        buyer_profiles_col().delete_many({})
        notifications_col().delete_many({})

    def test_farmer_registration_success(self):
        payload = {
            "username": "ramesh_farmer",
            "email": "ramesh@farm.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer",
            "first_name": "Ramesh",
            "last_name": "Kumar",
            "phone": "+91-9876543211",
            "state": "Maharashtra",
            "district": "Nashik",
            "village": "Deola",
            "experience_years": 15,
            "preferred_language": "Marathi"
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('access', data['data'])
        self.assertIn('refresh', data['data'])
        self.assertEqual(data['data']['user']['username'], 'ramesh_farmer')
        self.assertEqual(data['data']['user']['role'], 'farmer')

        # Check DB documents directly in PyMongo
        user = users_col().find_one({"email": "ramesh@farm.org"})
        self.assertIsNotNone(user)
        self.assertEqual(user['role'], 'farmer')

        farmer_prof = farmer_profiles_col().find_one({"user_id": user['_id']})
        self.assertIsNotNone(farmer_prof)
        self.assertEqual(farmer_prof['district'], 'Nashik')

        # Check welcome notification
        notif = notifications_col().find_one({"user_id": user['_id']})
        self.assertIsNotNone(notif)
        self.assertIn('Welcome', notif['title'])

    def test_duplicate_registration_prevented(self):
        payload = {
            "username": "buyer_suresh",
            "email": "suresh@trade.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "buyer"
        }
        res1 = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res1.status_code, 201)

        # Re-register with same email
        res2 = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res2.status_code, 400)
        self.assertFalse(res2.json()['success'])

    def test_login_success_and_failure(self):
        # Register user
        reg_payload = {
            "username": "kisan_vijay",
            "email": "vijay@kisan.in",
            "password": "SecretPassword1",
            "confirm_password": "SecretPassword1",
            "role": "farmer"
        }
        self.client.post('/api/auth/register/', reg_payload, format='json')

        # Test valid login with email
        login_res = self.client.post('/api/auth/login/', {
            "username_or_email": "vijay@kisan.in",
            "password": "SecretPassword1"
        }, format='json')
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertTrue(login_data['success'])
        access_token = login_data['data']['access']
        self.assertTrue(bool(access_token))

        # Test invalid login with wrong password
        fail_res = self.client.post('/api/auth/login/', {
            "username_or_email": "vijay@kisan.in",
            "password": "WrongPassword"
        }, format='json')
        self.assertEqual(fail_res.status_code, 401)

    def test_authenticated_profile_view_and_update(self):
        reg_payload = {
            "username": "buyer_anita",
            "email": "anita@agrotrade.com",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "buyer",
            "business_name": "Agro Fresh Ltd",
            "business_type": "wholesaler"
        }
        reg_res = self.client.post('/api/auth/register/', reg_payload, format='json')
        token = reg_res.json()['data']['access']

        # Get profile with Bearer token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        profile_res = self.client.get('/api/auth/profile/')
        self.assertEqual(profile_res.status_code, 200)
        p_data = profile_res.json()['data']
        self.assertEqual(p_data['user']['email'], 'anita@agrotrade.com')
        self.assertEqual(p_data['role_profile']['business_name'], 'Agro Fresh Ltd')

        # Update profile
        update_payload = {
            "first_name": "Anita",
            "last_name": "Sharma",
            "city": "Pune",
            "delivery_address": "APMC Market Yard, Pune"
        }
        put_res = self.client.put('/api/auth/profile/', update_payload, format='json')
        self.assertEqual(put_res.status_code, 200)
        updated_data = put_res.json()['data']
        self.assertEqual(updated_data['user']['first_name'], 'Anita')
        self.assertEqual(updated_data['role_profile']['city'], 'Pune')

    def test_token_refresh(self):
        reg_payload = {
            "username": "token_tester",
            "email": "token@test.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }
        reg_res = self.client.post('/api/auth/register/', reg_payload, format='json')
        refresh_token = reg_res.json()['data']['refresh']

        ref_res = self.client.post('/api/auth/refresh/', {"refresh": refresh_token}, format='json')
        self.assertEqual(ref_res.status_code, 200)
        self.assertIn('access', ref_res.json()['data'])

    def test_role_based_permissions(self):
        # Register Farmer
        f_reg = self.client.post('/api/auth/register/', {
            "username": "perm_farmer",
            "email": "farmer@perm.in",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        farmer_token = f_reg.json()['data']['access']

        # Register Buyer
        b_reg = self.client.post('/api/auth/register/', {
            "username": "perm_buyer",
            "email": "buyer@perm.in",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "buyer"
        }, format='json')
        buyer_token = b_reg.json()['data']['access']

        # Farmer tests
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {farmer_token}')
        from common.authentication import MongoUser
        farmer_user = users_col().find_one({"email": "farmer@perm.in"})
        perm_farmer = IsFarmer()
        perm_buyer = IsBuyer()
        perm_admin = IsAdmin()

        class DummyRequest:
            def __init__(self, user):
                self.user = MongoUser(user)

        req_f = DummyRequest(farmer_user)
        self.assertTrue(perm_farmer.has_permission(req_f, None))
        self.assertFalse(perm_buyer.has_permission(req_f, None))
        self.assertFalse(perm_admin.has_permission(req_f, None))

        # Buyer tests
        buyer_user = users_col().find_one({"email": "buyer@perm.in"})
        req_b = DummyRequest(buyer_user)
        self.assertFalse(perm_farmer.has_permission(req_b, None))
        self.assertTrue(perm_buyer.has_permission(req_b, None))
        self.assertFalse(perm_admin.has_permission(req_b, None))

    def test_admin_user_management(self):
        from common.authentication import generate_tokens_for_user
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)

        # 1. Create Admin
        admin_doc = {
            "username": "superadmin",
            "email": "superadmin@agri.gov",
            "password_hash": "dummyhash",
            "role": "admin",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        res_adm = users_col().insert_one(admin_doc)
        admin_doc['_id'] = res_adm.inserted_id
        admin_token = generate_tokens_for_user(admin_doc)['access']

        # 2. Register Farmer
        f_reg = self.client.post('/api/auth/register/', {
            "username": "managed_farmer",
            "email": "managed@farmer.in",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer",
            "first_name": "Managed",
            "last_name": "Kisan"
        }, format='json')
        farmer_id = f_reg.json()['data']['user']['id']
        farmer_token = f_reg.json()['data']['access']

        # 3. Farmer attempts to access admin endpoint -> 403 Forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {farmer_token}')
        res_denied = self.client.get('/api/auth/users/')
        self.assertEqual(res_denied.status_code, 403)

        # 4. Admin accesses user list -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        res_users = self.client.get('/api/auth/users/?role=farmer')
        self.assertEqual(res_users.status_code, 200)
        users_data = res_users.json()['data']
        self.assertTrue(any(u['username'] == 'managed_farmer' for u in users_data))

        # 5. Admin suspends farmer account
        res_toggle = self.client.put(f'/api/auth/users/{farmer_id}/status/', {'is_active': False}, format='json')
        self.assertEqual(res_toggle.status_code, 200)
        self.assertFalse(res_toggle.json()['data']['is_active'])

        # Verify DB updated
        farmer_in_db = users_col().find_one({"username": "managed_farmer"})
        self.assertFalse(farmer_in_db['is_active'])

