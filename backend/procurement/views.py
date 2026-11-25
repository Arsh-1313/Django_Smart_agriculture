"""
Procurement Centre, Delivery Slots, and Farmer Booking REST API Views.
"""

import uuid
from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework import status

from common.db import (
    procurement_centres_col,
    procurement_slots_col,
    bookings_col,
    farmer_profiles_col,
)
from common.permissions import IsAuthenticatedMongo, IsFarmer, IsAdmin
from common.utils import api_response, serialize_doc, parse_object_id
from procurement.serializers import (
    ProcurementCentreSerializer,
    ProcurementSlotCreateSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
)
from notifications.services import create_notification


class ProcurementCentreListCreateView(APIView):
    """
    GET: List active procurement centres with location and filter support.
    POST: Admin registers a new procurement centre.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticatedMongo()]

    def get(self, request):
        query = {"status": "active"}
        state = request.query_params.get('state')
        district = request.query_params.get('district')
        crop = request.query_params.get('crop')

        if state:
            query["state"] = {"$regex": state.strip(), "$options": "i"}
        if district:
            query["district"] = {"$regex": district.strip(), "$options": "i"}
        if crop:
            query["commodities_accepted"] = {"$regex": crop.strip(), "$options": "i"}

        cursor = procurement_centres_col().find(query).sort("name", 1)
        centres = [serialize_doc(doc) for doc in cursor]

        return api_response(
            success=True,
            data=centres,
            message=f"Found {len(centres)} procurement centres."
        )

    def post(self, request):
        serializer = ProcurementCentreSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid procurement centre details.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        now = datetime.now(timezone.utc)

        doc = {
            "name": data['name'].strip(),
            "state": data['state'].strip(),
            "district": data['district'].strip(),
            "address": data['address'].strip(),
            "location": {
                "type": "Point",
                "coordinates": [data['longitude'], data['latitude']]
            },
            "contact_phone": data['contact_phone'].strip(),
            "capacity_quintals": data['capacity_quintals'],
            "commodities_accepted": data.get('commodities_accepted', []),
            "operating_hours": data.get('operating_hours', '08:00 AM - 05:00 PM'),
            "status": "active",
            "created_at": now,
        }

        res = procurement_centres_col().insert_one(doc)
        doc['_id'] = res.inserted_id

        return api_response(
            success=True,
            message=f"Procurement centre '{doc['name']}' registered successfully.",
            data=serialize_doc(doc),
            status_code=status.HTTP_201_CREATED
        )


class ProcurementCentreDetailView(APIView):
    """
    GET: Details of a single procurement centre.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request, centre_id):
        c_oid, err = parse_object_id(centre_id)
        if err:
            return api_response(success=False, message="Invalid centre ID.", status_code=status.HTTP_400_BAD_REQUEST)

        centre = procurement_centres_col().find_one({"_id": c_oid})
        if not centre:
            return api_response(success=False, message="Centre not found.", status_code=status.HTTP_404_NOT_FOUND)

        return api_response(success=True, data=serialize_doc(centre))


class ProcurementSlotListCreateView(APIView):
    """
    GET: List delivery slots for a procurement centre.
    POST: Admin adds delivery slots for a centre.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticatedMongo()]

    def get(self, request, centre_id):
        c_oid, err = parse_object_id(centre_id)
        if err:
            return api_response(success=False, message="Invalid centre ID.", status_code=status.HTTP_400_BAD_REQUEST)

        query = {"centre_id": c_oid}
        date = request.query_params.get('date')
        if date:
            query["slot_date"] = date

        # Filter out closed slots for farmers
        if request.user.role != 'admin':
            query["status"] = {"$in": ["available", "full"]}

        cursor = procurement_slots_col().find(query).sort([("slot_date", 1), ("start_time", 1)])
        slots = [serialize_doc(doc) for doc in cursor]

        return api_response(
            success=True,
            data=slots,
            message=f"Retrieved {len(slots)} procurement delivery slots."
        )

    def post(self, request, centre_id):
        c_oid, err = parse_object_id(centre_id)
        if err:
            return api_response(success=False, message="Invalid centre ID.", status_code=status.HTTP_400_BAD_REQUEST)

        centre = procurement_centres_col().find_one({"_id": c_oid})
        if not centre:
            return api_response(success=False, message="Centre not found.", status_code=status.HTTP_404_NOT_FOUND)

        serializer = ProcurementSlotCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        now = datetime.now(timezone.utc)

        doc = {
            "centre_id": c_oid,
            "centre_name": centre['name'],
            "slot_date": data['slot_date'].strip(),
            "start_time": data['start_time'].strip(),
            "end_time": data['end_time'].strip(),
            "capacity_quintals": data['capacity_quintals'],
            "booked_quintals": 0.0,
            "status": "available",
            "created_at": now,
        }

        res = procurement_slots_col().insert_one(doc)
        doc['_id'] = res.inserted_id

        return api_response(
            success=True,
            message="Procurement slot opened successfully.",
            data=serialize_doc(doc),
            status_code=status.HTTP_201_CREATED
        )


class BookingListCreateView(APIView):
    """
    GET: List bookings (Farmer sees own bookings; Admin sees all bookings).
    POST: Farmer books a procurement delivery slot.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsFarmer()]
        return [IsAuthenticatedMongo()]

    def get(self, request):
        user = request.user
        query = {}
        if user.role != 'admin':
            query["farmer_id"] = user.object_id

        centre_id = request.query_params.get('centre_id')
        if centre_id:
            c_oid, err = parse_object_id(centre_id)
            if not err:
                query["centre_id"] = c_oid

        cursor = bookings_col().find(query).sort("created_at", -1)
        bookings = [serialize_doc(doc) for doc in cursor]

        return api_response(
            success=True,
            data=bookings,
            message=f"Retrieved {len(bookings)} procurement bookings."
        )

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid booking details.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        c_oid, err1 = parse_object_id(data['centre_id'])
        s_oid, err2 = parse_object_id(data['slot_id'])

        if err1 or err2:
            return api_response(success=False, message="Invalid centre or slot ID.", status_code=status.HTTP_400_BAD_REQUEST)

        centre = procurement_centres_col().find_one({"_id": c_oid})
        slot = procurement_slots_col().find_one({"_id": s_oid, "centre_id": c_oid})

        if not centre:
            return api_response(success=False, message="Procurement centre not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not slot:
            return api_response(success=False, message="Delivery slot not found.", status_code=status.HTTP_404_NOT_FOUND)

        if slot.get('status') != 'available':
            return api_response(success=False, message="This delivery slot is fully booked or closed.", status_code=status.HTTP_400_BAD_REQUEST)

        qty = float(data['estimated_quantity_quintals'])
        capacity = float(slot['capacity_quintals'])
        booked = float(slot.get('booked_quintals', 0.0))
        remaining = capacity - booked

        if qty > remaining:
            return api_response(
                success=False,
                message=f"Slot capacity exceeded. Available: {remaining:.1f} Qtl, requested: {qty:.1f} Qtl.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        now = datetime.now(timezone.utc)
        booking_code = f"PRC-{now.strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        farmer = request.user
        profile = farmer_profiles_col().find_one({"user_id": farmer.object_id})
        farmer_name = profile.get("full_name") or farmer.username
        farmer_phone = data.get('contact_phone') or (profile.get('phone') if profile else '')

        booking_doc = {
            "booking_code": booking_code,
            "farmer_id": farmer.object_id,
            "farmer_name": farmer_name,
            "farmer_phone": farmer_phone,
            "centre_id": c_oid,
            "centre_name": centre['name'],
            "slot_id": s_oid,
            "slot_date": slot['slot_date'],
            "slot_time": f"{slot['start_time']} - {slot['end_time']}",
            "crop_name": data['crop_name'].strip(),
            "estimated_quantity_quintals": qty,
            "vehicle_number": data.get('vehicle_number', '').strip(),
            "status": "confirmed",
            "created_at": now,
            "updated_at": now,
        }

        # Update slot booked quantity
        new_booked = booked + qty
        new_slot_status = "full" if (capacity - new_booked) < 0.1 else "available"
        procurement_slots_col().update_one(
            {"_id": s_oid},
            {"$set": {"booked_quintals": new_booked, "status": new_slot_status}}
        )

        res = bookings_col().insert_one(booking_doc)
        booking_doc['_id'] = res.inserted_id

        # In-app notification
        create_notification(
            user_id=farmer.object_id,
            title=f"Procurement Slot Confirmed: {booking_code}",
            message=f"Your delivery slot for {qty} Qtl {data['crop_name']} at {centre['name']} on {slot['slot_date']} ({slot['start_time']}) is confirmed.",
            notification_type="procurement",
            link="/farmer/procurement"
        )

        return api_response(
            success=True,
            message="Delivery slot booked successfully.",
            data=serialize_doc(booking_doc),
            status_code=status.HTTP_201_CREATED
        )


class BookingStatusUpdateView(APIView):
    """
    PUT: Update booking status (cancel, mark complete).
    Releases slot quota upon cancellation.
    """
    permission_classes = [IsAuthenticatedMongo]

    def put(self, request, booking_id):
        b_oid, err = parse_object_id(booking_id)
        if err:
            return api_response(success=False, message="Invalid booking ID.", status_code=status.HTTP_400_BAD_REQUEST)

        booking = bookings_col().find_one({"_id": b_oid})
        if not booking:
            return api_response(success=False, message="Booking not found.", status_code=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_owner = booking['farmer_id'] == user.object_id
        is_admin = user.role == 'admin'

        if not (is_owner or is_admin):
            return api_response(success=False, message="Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = BookingStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        if is_owner and not is_admin and new_status != 'cancelled':
            return api_response(success=False, message="Farmers can only cancel pending bookings.", status_code=status.HTTP_403_FORBIDDEN)

        now = datetime.now(timezone.utc)

        # Release capacity if cancelled
        if new_status == 'cancelled' and booking['status'] != 'cancelled':
            procurement_slots_col().update_one(
                {"_id": booking['slot_id']},
                {
                    "$inc": {"booked_quintals": -booking['estimated_quantity_quintals']},
                    "$set": {"status": "available"}
                }
            )

        bookings_col().update_one(
            {"_id": b_oid},
            {"$set": {"status": new_status, "updated_at": now}}
        )

        create_notification(
            user_id=booking['farmer_id'],
            title=f"Booking Status: {booking['booking_code']}",
            message=f"Your delivery booking at {booking['centre_name']} has been marked as {new_status}.",
            notification_type="procurement",
            link="/farmer/procurement"
        )

        updated = bookings_col().find_one({"_id": b_oid})
        return api_response(
            success=True,
            message=f"Booking updated to {new_status}.",
            data=serialize_doc(updated)
        )
