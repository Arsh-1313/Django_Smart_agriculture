"""
Complaints, Grievances, and Support Ticket Views for Smart Agriculture.
"""

from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework import status

from common.db import complaints_col, users_col
from common.permissions import IsAuthenticatedMongo, IsAdmin
from common.utils import api_response, serialize_doc, parse_object_id
from notifications.services import create_notification


class ComplaintListCreateView(APIView):
    """
    POST: Submit a grievance / complaint / technical support request.
    GET:  Farmers & Buyers retrieve their own tickets; Admin retrieves all tickets.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        user = request.user
        query = {}

        if user.role != 'admin':
            query['user_id'] = user.object_id
        else:
            status_filter = request.query_params.get('status')
            category_filter = request.query_params.get('category')
            if status_filter:
                query['status'] = status_filter
            if category_filter:
                query['category'] = category_filter

        complaints = list(complaints_col().find(query).sort('created_at', -1))
        return api_response(
            success=True,
            data=serialize_doc(complaints)
        )

    def post(self, request):
        user = request.user
        subject = request.data.get('subject', '').strip()
        message = request.data.get('message', '').strip()
        category = request.data.get('category', 'technical').strip()
        priority = request.data.get('priority', 'medium').strip()

        if not subject or not message:
            return api_response(
                success=False,
                message="Both 'subject' and 'message' are required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        valid_categories = ['marketplace', 'procurement', 'weather', 'disease_detection', 'technical', 'billing', 'other']
        if category not in valid_categories:
            category = 'other'

        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if priority not in valid_priorities:
            priority = 'medium'

        now = datetime.now(timezone.utc)
        complaint_doc = {
            "user_id": user.object_id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "category": category,
            "subject": subject,
            "message": message,
            "priority": priority,
            "status": "open",
            "admin_response": "",
            "resolved_at": None,
            "created_at": now,
            "updated_at": now,
        }

        res = complaints_col().insert_one(complaint_doc)
        complaint_doc['_id'] = res.inserted_id

        # Notify user ticket was received
        create_notification(
            user_id=user.object_id,
            title="Support Ticket Created",
            message=f"Your ticket '{subject[:40]}...' has been registered with ID #{str(res.inserted_id)[-6:]}. Our support team will review it shortly.",
            notification_type="system",
            link="/farmer/support" if user.role == 'farmer' else "/buyer/support"
        )

        return api_response(
            success=True,
            message="Support ticket registered successfully.",
            data=serialize_doc(complaint_doc),
            status_code=status.HTTP_201_CREATED
        )


class ComplaintDetailResolveView(APIView):
    """
    GET: Retrieve ticket details.
    PUT: Admin resolves or updates complaint status and writes admin resolution notes.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request, complaint_id):
        c_oid, err = parse_object_id(complaint_id)
        if err or not c_oid:
            return api_response(success=False, message="Invalid complaint ID.", status_code=status.HTTP_400_BAD_REQUEST)

        complaint = complaints_col().find_one({"_id": c_oid})
        if not complaint:
            return api_response(success=False, message="Ticket not found.", status_code=status.HTTP_404_NOT_FOUND)

        if request.user.role != 'admin' and complaint['user_id'] != request.user.object_id:
            return api_response(success=False, message="Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        return api_response(success=True, data=serialize_doc(complaint))

    def put(self, request, complaint_id):
        if request.user.role != 'admin':
            return api_response(success=False, message="Only administrators can resolve tickets.", status_code=status.HTTP_403_FORBIDDEN)

        c_oid, err = parse_object_id(complaint_id)
        if err or not c_oid:
            return api_response(success=False, message="Invalid complaint ID.", status_code=status.HTTP_400_BAD_REQUEST)

        complaint = complaints_col().find_one({"_id": c_oid})
        if not complaint:
            return api_response(success=False, message="Ticket not found.", status_code=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', 'resolved')
        admin_response = request.data.get('admin_response', '').strip()

        if new_status not in ['open', 'in_progress', 'resolved', 'closed', 'rejected']:
            new_status = 'resolved'

        now = datetime.now(timezone.utc)
        updates = {
            "status": new_status,
            "admin_response": admin_response or complaint.get('admin_response', ''),
            "updated_at": now,
        }
        if new_status in ['resolved', 'closed']:
            updates['resolved_at'] = now

        complaints_col().update_one({"_id": c_oid}, {"$set": updates})

        # Notify complainant
        create_notification(
            user_id=complaint['user_id'],
            title=f"Support Ticket #{str(c_oid)[-6:]} Updated: {new_status.title()}",
            message=f"Administrator response: {admin_response or 'Your ticket has been marked as ' + new_status}.",
            notification_type="system",
            link="/farmer/support" if complaint.get('role') == 'farmer' else "/buyer/support"
        )

        updated = complaints_col().find_one({"_id": c_oid})
        return api_response(
            success=True,
            message=f"Complaint marked as {new_status}.",
            data=serialize_doc(updated)
        )
