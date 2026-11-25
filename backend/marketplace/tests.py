"""
Automated unit tests for Mandi Market Prices, Produce Listings, and Buyer Orders.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from common.db import users_col, product_listings_col, orders_col, notifications_col


class MarketplaceTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        users_col().delete_many({})
        product_listings_col().delete_many({})
        orders_col().delete_many({})
        notifications_col().delete_many({})

        # Register Farmer
        f_res = self.client.post('/api/auth/register/', {
            "username": "market_farmer",
            "email": "farmer_market@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.farmer_token = f_res.json()['data']['access']

        # Register Buyer
        b_res = self.client.post('/api/auth/register/', {
            "username": "market_buyer",
            "email": "buyer_market@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "buyer"
        }, format='json')
        self.buyer_token = b_res.json()['data']['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')

    def test_mandi_prices_endpoints(self):
        res = self.client.get('/api/market/prices/')
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()['data']), 5)

        c_res = self.client.get('/api/market/commodities/')
        self.assertEqual(c_res.status_code, 200)

        s_res = self.client.get('/api/market/states/')
        self.assertEqual(s_res.status_code, 200)

    def test_produce_listing_and_buyer_ordering_lifecycle(self):
        # 1. Farmer creates produce listing
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')
        listing_payload = {
            "crop_name": "Wheat",
            "variety": "Sharbati Gold",
            "quantity_quintals": 100.0,
            "price_per_quintal": 2400.0,
            "quality_grade": "Grade A",
            "state": "Madhya Pradesh",
            "district": "Sehore",
            "description": "Premium harvest grain sun-dried."
        }
        res = self.client.post('/api/market/listings/', listing_payload, format='json')
        self.assertEqual(res.status_code, 201)
        listing = res.json()['data']
        listing_id = listing.get('id') or listing.get('_id')
        self.assertEqual(listing['available_quantity'], 100.0)

        # 2. Browse listings with filters
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')
        search_res = self.client.get('/api/market/listings/?crop=Wheat&state=Madhya Pradesh')
        self.assertEqual(search_res.status_code, 200)
        self.assertEqual(len(search_res.json()['data']), 1)

        # 3. Buyer places purchase order for 40 quintals
        order_payload = {
            "listing_id": listing_id,
            "quantity_quintals": 40.0,
            "delivery_address": "Shop 12, APMC Grain Market, Indore",
            "contact_phone": "+91 9876543210",
            "notes": "Urgent procurement"
        }
        order_res = self.client.post('/api/orders/', order_payload, format='json')
        self.assertEqual(order_res.status_code, 201)
        order = order_res.json()['data']
        order_id = order.get('id') or order.get('_id')
        self.assertEqual(order['quantity_quintals'], 40.0)
        self.assertEqual(order['total_price'], 96000.0)
        self.assertEqual(order['status'], 'requested')

        # 4. Check available quantity on listing reduced to 60 quintals
        updated_listing = product_listings_col().find_one()
        self.assertEqual(updated_listing['available_quantity'], 60.0)

        # 5. Check in-app notifications generated (1 welcome + 1 order = 2 each)
        farmer_user = users_col().find_one({"username": "market_farmer"})
        buyer_user = users_col().find_one({"username": "market_buyer"})
        self.assertEqual(notifications_col().count_documents({"user_id": farmer_user['_id']}), 2)
        self.assertEqual(notifications_col().count_documents({"user_id": buyer_user['_id']}), 2)

        # 6. Farmer accepts the order
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')
        accept_res = self.client.put(f'/api/orders/{order_id}/status/', {
            "status": "accepted",
            "remarks": "Produce bagged and ready for dispatch."
        }, format='json')
        self.assertEqual(accept_res.status_code, 200)
        self.assertEqual(accept_res.json()['data']['status'], 'accepted')

        # 7. Farmer cancels/restores: if order cancelled, inventory returned
        cancel_res = self.client.put(f'/api/orders/{order_id}/status/', {
            "status": "cancelled",
            "remarks": "Logistics issue."
        }, format='json')
        self.assertEqual(cancel_res.status_code, 200)

        # Available quantity restored to 100 quintals
        restored_listing = product_listings_col().find_one()
        self.assertEqual(restored_listing['available_quantity'], 100.0)

    def test_buyer_inquiry_on_listing(self):
        # 1. Farmer creates listing
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')
        create_res = self.client.post('/api/market/listings/', {
            "crop_name": "Mustard",
            "variety": "Pusa Bold",
            "quantity_quintals": 50.0,
            "price_per_quintal": 5400.0,
            "quality_grade": "Grade A",
            "state": "Rajasthan",
            "district": "Bharatpur",
            "harvest_date": "2026-03-20"
        }, format='json')
        self.assertEqual(create_res.status_code, 201)
        listing_id = create_res.json()['data'].get('id') or create_res.json()['data'].get('_id')

        # 2. Buyer sends direct inquiry
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.buyer_token}')
        inq_res = self.client.post(f'/api/market/listings/{listing_id}/inquire/', {
            "message": "Can you offer a bulk discount for all 50 quintals?",
            "quantity_quintals": 50.0
        }, format='json')
        self.assertEqual(inq_res.status_code, 200)
        self.assertTrue(inq_res.json()['success'])
        self.assertIn('farmer_name', inq_res.json()['data'])

