"""
Unit and integration tests for Grievance Support Tickets and Admin Reports.
"""

from datetime import datetime, timezone
from django.test import TestCase
from rest_framework.test import APIClient

from common.db import complaints_col, users_col, notifications_col
from common.authentication import generate_tokens_for_user


class SupportAndReportsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        complaints_col().delete_many({})
        users_col().delete_many({})
        notifications_col().delete_many({})
        now = datetime.now(timezone.utc)

        # Create Admin
        self.admin_doc = {
            "username": "report_admin",
            "email": "report_admin@agri.gov",
            "password_hash": "dummy",
            "role": "admin",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        res_a = users_col().insert_one(self.admin_doc)
        self.admin_doc['_id'] = res_a.inserted_id
        self.admin_token = generate_tokens_for_user(self.admin_doc)['access']

        # Create Farmer
        self.farmer_doc = {
            "username": "ticket_farmer",
            "email": "ticket@kisan.in",
            "password_hash": "dummy",
            "role": "farmer",
            "phone": "+91-9876543210",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        res_f = users_col().insert_one(self.farmer_doc)
        self.farmer_doc['_id'] = res_f.inserted_id
        self.farmer_token = generate_tokens_for_user(self.farmer_doc)['access']

    def test_complaint_lifecycle(self):
        # 1. Farmer creates a support ticket
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')
        create_res = self.client.post('/api/support/complaints/', {
            "category": "marketplace",
            "subject": "Delay in buyer payment confirmation",
            "message": "Buyer placed order #1002 but payment transfer has not arrived after 48 hours.",
            "priority": "high"
        }, format='json')
        self.assertEqual(create_res.status_code, 201)
        ticket_id = create_res.json()['data']['id']
        self.assertEqual(create_res.json()['data']['status'], 'open')

        # 2. Farmer views their complaints
        list_res = self.client.get('/api/support/complaints/')
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.json()['data']), 1)

        # 3. Admin views all complaints
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        admin_list = self.client.get('/api/support/complaints/')
        self.assertEqual(admin_list.status_code, 200)
        self.assertEqual(len(admin_list.json()['data']), 1)

        # 4. Admin resolves complaint
        resolve_res = self.client.put(f'/api/support/complaints/{ticket_id}/resolve/', {
            "status": "resolved",
            "admin_response": "Support contacted buyer. Transaction completed and escrow release verified."
        }, format='json')
        self.assertEqual(resolve_res.status_code, 200)
        self.assertEqual(resolve_res.json()['data']['status'], 'resolved')
        self.assertTrue('Support contacted buyer' in resolve_res.json()['data']['admin_response'])

        # 5. Farmer views updated ticket with admin response
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.farmer_token}')
        detail_res = self.client.get(f'/api/support/complaints/{ticket_id}/')
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.json()['data']['status'], 'resolved')

    def test_admin_reports_summary_and_export(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # 1. Test Summary
        sum_res = self.client.get('/api/admin/reports/summary/')
        self.assertEqual(sum_res.status_code, 200)
        data = sum_res.json()['data']
        self.assertIn('users', data)
        self.assertIn('marketplace', data)
        self.assertIn('predictions', data)
        self.assertIn('support', data)

        # 2. Test CSV Export (users)
        export_res = self.client.get('/api/admin/reports/export/?type=users')
        self.assertEqual(export_res.status_code, 200)
        self.assertEqual(export_res['Content-Type'], 'text/csv')
        csv_content = export_res.content.decode('utf-8')
        self.assertIn('ticket_farmer', csv_content)
