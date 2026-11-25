"""
Unit and integration tests for In-App Notifications.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from common.db import users_col, notifications_col
from notifications.services import create_notification


class NotificationsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        users_col().delete_many({})
        notifications_col().delete_many({})

        # Register Farmer (this creates 1 welcome notification)
        reg = self.client.post('/api/auth/register/', {
            "username": "notify_farmer",
            "email": "farmer_notify@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.token = reg.json()['data']['access']
        self.user = users_col().find_one({"username": "notify_farmer"})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_notification_flow(self):
        # 1. Create 2 additional notifications via service
        create_notification(
            user_id=self.user['_id'],
            title="Weather Alert",
            message="Heavy rain forecast in your district.",
            notification_type="weather_alert",
            link="/farmer/weather"
        )
        create_notification(
            user_id=self.user['_id'],
            title="Market Price Surge",
            message="Wheat prices increased by 8% today.",
            notification_type="price_alert",
            link="/farmer/market-prices"
        )

        # 2. Retrieve list (1 welcome + 2 created = 3 total)
        res = self.client.get('/api/notifications/')
        self.assertEqual(res.status_code, 200)
        data = res.json()['data']
        self.assertEqual(len(data['notifications']), 3)
        self.assertEqual(data['unread_count'], 3)

        # 3. Mark single as read
        notif_id = data['notifications'][0]['id']
        read_res = self.client.put(f'/api/notifications/{notif_id}/read/')
        self.assertEqual(read_res.status_code, 200)

        # 4. Verify unread count is now 2
        res2 = self.client.get('/api/notifications/')
        self.assertEqual(res2.json()['data']['unread_count'], 2)

        # 5. Mark all as read
        read_all_res = self.client.put('/api/notifications/read-all/')
        self.assertEqual(read_all_res.status_code, 200)

        res3 = self.client.get('/api/notifications/')
        self.assertEqual(res3.json()['data']['unread_count'], 0)
