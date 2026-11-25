"""
Automated unit tests for Procurement Centres, Delivery Slots, and Bookings.
"""

from datetime import datetime, timezone
from django.test import TestCase
from rest_framework.test import APIClient
from common.db import (
    users_col,
    procurement_centres_col,
    procurement_slots_col,
    bookings_col,
    notifications_col,
)
from common.authentication import generate_tokens_for_user, hash_password


class ProcurementTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        users_col().delete_many({})
        procurement_centres_col().delete_many({})
        procurement_slots_col().delete_many({})
        bookings_col().delete_many({})
        notifications_col().delete_many({})

        # Register Farmer
        f_res = self.client.post('/api/auth/register/', {
            "username": "procure_farmer",
            "email": "farmer_procure@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.farmer_token = f_res.json()['data']['access']

        # Create Admin directly in database
        now = datetime.now(timezone.utc)
        admin_doc = {
            "username": "procure_admin",
            "email": "admin_procure@agri.org",
            "password_hash": hash_password("Password@123"),
            "role": "admin",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        res_adm = users_col().insert_one(admin_doc)
        admin_doc['_id'] = res_adm.inserted_id
        self.admin_token = generate_tokens_for_user(admin_doc)['access']

    def test_procurement_booking_workflow(self):
        # 1. Admin creates procurement centre
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        centre_payload = {
            "name": "Karnal Test Silo Hub",
            "state": "Haryana",
            "district": "Karnal",
            "address": "GT Road, Karnal",
            "latitude": 29.6857,
            "longitude": 76.9905,
            "contact_phone": "+91 184 225 1111",
            "capacity_quintals": 10000.0,
            "commodities_accepted": ["Wheat", "Paddy"],
            "operating_hours": "08:00 AM - 05:00 PM"
        }
        res_centre = self.client.post('/api/procurement/centres/', centre_payload, format='json')
        self.assertEqual(res_centre.status_code, 201)
        centre = res_centre.json()['data']
        centre_id = centre.get('id') or centre.get('_id')

        # 2. Admin creates a delivery slot
        slot_payload = {
            "slot_date": "2026-11-25",
            "start_time": "09:00 AM",
            "end_time": "12:00 PM",
            "capacity_quintals": 500.0
        }
        res_slot = self.client.post(f'/api/procurement/centres/{centre_id}/slots/', slot_payload, format='json')
        self.assertEqual(res_slot.status_code, 201)
        slot = res_slot.json()['data']
        slot_id = slot.get('id') or slot.get('_id')

        # 3. Farmer lists centres and slots
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')
        res_list = self.client.get('/api/procurement/centres/')
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()['data']), 1)

        res_slots = self.client.get(f'/api/procurement/centres/{centre_id}/slots/')
        self.assertEqual(res_slots.status_code, 200)
        self.assertEqual(len(res_slots.json()['data']), 1)

        # 4. Farmer books delivery slot for 120 quintals
        booking_payload = {
            "centre_id": centre_id,
            "slot_id": slot_id,
            "crop_name": "Wheat",
            "estimated_quantity_quintals": 120.0,
            "vehicle_number": "HR 05 AB 1234",
            "contact_phone": "+91 9998887776"
        }
        res_book = self.client.post('/api/procurement/bookings/', booking_payload, format='json')
        self.assertEqual(res_book.status_code, 201)
        booking = res_book.json()['data']
        booking_id = booking.get('id') or booking.get('_id')
        self.assertTrue(booking['booking_code'].startswith('PRC-'))
        self.assertEqual(booking['estimated_quantity_quintals'], 120.0)

        # 5. Slot booked quintals updated to 120.0
        slot_doc = procurement_slots_col().find_one()
        self.assertEqual(slot_doc['booked_quintals'], 120.0)

        # 6. In-app notification generated for the farmer (1 welcome + 1 booking = 2)
        farmer_user = users_col().find_one({"username": "procure_farmer"})
        self.assertEqual(notifications_col().count_documents({"user_id": farmer_user['_id']}), 2)

        # 7. Farmer views their bookings
        res_my_bookings = self.client.get('/api/procurement/bookings/')
        self.assertEqual(res_my_bookings.status_code, 200)
        self.assertEqual(len(res_my_bookings.json()['data']), 1)

        # 8. Farmer cancels booking -> releases slot capacity
        res_cancel = self.client.put(f'/api/procurement/bookings/{booking_id}/status/', {
            "status": "cancelled",
            "remarks": "Vehicle breakdown."
        }, format='json')
        self.assertEqual(res_cancel.status_code, 200)

        updated_slot = procurement_slots_col().find_one()
        self.assertEqual(updated_slot['booked_quintals'], 0.0)
