"""
Views for Master Crops Catalog and Farm Cultivation History.
All operations interact with MongoDB Atlas via PyMongo.
"""

from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework import status
from pymongo import ASCENDING, DESCENDING

from common.db import (
    crops_col,
    crop_history_col,
    farms_col,
)
from common.permissions import IsFarmer, IsAdmin, IsAuthenticatedMongo
from common.utils import api_response, serialize_doc, parse_object_id
from crops.serializers import CropSerializer, CropHistorySerializer


class CropListView(APIView):
    """
    GET: Search and filter agricultural crop catalog. Accessible to all authenticated users.
    POST: Add new crop to master catalog (Admin only).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticatedMongo()]

    def get(self, request):
        category = request.query_params.get('category')
        search_query = request.query_params.get('q', '').strip()

        filter_dict = {}
        if category:
            filter_dict['category'] = category
        if search_query:
            filter_dict['name'] = {"$regex": search_query, "$options": "i"}

        crops_cursor = crops_col().find(filter_dict).sort("name", ASCENDING)
        crops_list = list(crops_cursor)

        return api_response(
            success=True,
            data=serialize_doc(crops_list),
            message=f"Retrieved {len(crops_list)} crop(s)."
        )

    def post(self, request):
        serializer = CropSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        crop_name = data['name'].strip().capitalize()
        if crops_col().find_one({"name": crop_name}):
            return api_response(
                success=False,
                message=f"Crop '{crop_name}' already exists in catalog.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        crop_doc = {
            "name": crop_name,
            "category": data['category'],
            "ideal_temp_min": data.get('ideal_temp_min', 15.0),
            "ideal_temp_max": data.get('ideal_temp_max', 35.0),
            "ideal_rainfall_min": data.get('ideal_rainfall_min', 300.0),
            "ideal_rainfall_max": data.get('ideal_rainfall_max', 1500.0),
            "ideal_ph_min": data.get('ideal_ph_min', 5.5),
            "ideal_ph_max": data.get('ideal_ph_max', 7.5),
            "growing_period_days": data.get('growing_period_days', 120),
            "description": data.get('description', ''),
            "created_at": datetime.now(timezone.utc),
        }

        res = crops_col().insert_one(crop_doc)
        crop_doc['_id'] = res.inserted_id

        return api_response(
            success=True,
            message="Crop added to catalog.",
            data=serialize_doc(crop_doc),
            status_code=status.HTTP_201_CREATED
        )


class CropDetailView(APIView):
    """
    GET: Details of a specific crop from the master catalog.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request, crop_id):
        crop_oid, err = parse_object_id(crop_id)
        if err:
            return api_response(success=False, message=err, status_code=status.HTTP_400_BAD_REQUEST)

        crop = crops_col().find_one({"_id": crop_oid})
        if not crop:
            return api_response(success=False, message="Crop not found.", status_code=status.HTTP_404_NOT_FOUND)

        return api_response(success=True, data=serialize_doc(crop))


class FarmCropHistoryView(APIView):
    """
    GET: List cultivation history for a farm.
    POST: Record a planting or harvest cycle.
    """
    permission_classes = [IsFarmer]

    def _verify_farm(self, farm_id_str, user):
        farm_oid, err = parse_object_id(farm_id_str)
        if err:
            return None, api_response(success=False, message=err, status_code=status.HTTP_400_BAD_REQUEST)
        query = {"_id": farm_oid}
        if user.role != 'admin':
            query["farmer_id"] = user.object_id
        farm = farms_col().find_one(query)
        if not farm:
            return None, api_response(success=False, message="Farm not found or access denied.", status_code=status.HTTP_404_NOT_FOUND)
        return farm, None

    def get(self, request, farm_id):
        farm, err_resp = self._verify_farm(farm_id, request.user)
        if err_resp:
            return err_resp

        history_cursor = crop_history_col().find({"farm_id": farm['_id']}).sort([("year", DESCENDING), ("season", ASCENDING)])
        records = list(history_cursor)
        return api_response(
            success=True,
            data=serialize_doc(records),
            message=f"Retrieved {len(records)} crop cultivation record(s)."
        )

    def post(self, request, farm_id):
        farm, err_resp = self._verify_farm(farm_id, request.user)
        if err_resp:
            return err_resp

        serializer = CropHistorySerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid crop history record.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        now = datetime.now(timezone.utc)

        crop_oid = None
        if data.get('crop_id'):
            c_oid, _ = parse_object_id(data['crop_id'])
            crop_oid = c_oid

        # Convert date to datetime if provided
        p_date = data.get('planting_date')
        p_datetime = datetime(p_date.year, p_date.month, p_date.day, tzinfo=timezone.utc) if p_date else now

        h_date = data.get('harvest_date')
        h_datetime = datetime(h_date.year, h_date.month, h_date.day, tzinfo=timezone.utc) if h_date else None

        history_doc = {
            "farm_id": farm['_id'],
            "farmer_id": request.user.object_id,
            "crop_id": crop_oid,
            "crop_name": data['crop_name'].strip().capitalize(),
            "season": data['season'],
            "year": data['year'],
            "planted_area_acres": data['planted_area_acres'],
            "harvested_yield_quintals": data.get('harvested_yield_quintals', 0.0),
            "status": data['status'],
            "planting_date": p_datetime,
            "harvest_date": h_datetime,
            "notes": data.get('notes', ''),
            "created_at": now,
            "updated_at": now,
        }

        res = crop_history_col().insert_one(history_doc)
        history_doc['_id'] = res.inserted_id

        return api_response(
            success=True,
            message="Crop history record created successfully.",
            data=serialize_doc(history_doc),
            status_code=status.HTTP_201_CREATED
        )


class CropHistoryDetailView(APIView):
    """
    GET / PUT / DELETE a specific crop history log.
    """
    permission_classes = [IsFarmer]

    def _get_history(self, history_id_str, user):
        h_oid, err = parse_object_id(history_id_str)
        if err:
            return None, api_response(success=False, message=err, status_code=status.HTTP_400_BAD_REQUEST)
        query = {"_id": h_oid}
        if user.role != 'admin':
            query["farmer_id"] = user.object_id
        history = crop_history_col().find_one(query)
        if not history:
            return None, api_response(success=False, message="Cultivation record not found or access denied.", status_code=status.HTTP_404_NOT_FOUND)
        return history, None

    def get(self, request, history_id):
        history, err_resp = self._get_history(history_id, request.user)
        if err_resp:
            return err_resp
        return api_response(success=True, data=serialize_doc(history))

    def put(self, request, history_id):
        history, err_resp = self._get_history(history_id, request.user)
        if err_resp:
            return err_resp

        serializer = CropHistorySerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        now = datetime.now(timezone.utc)

        update_fields = {
            "crop_name": data['crop_name'].strip().capitalize(),
            "season": data['season'],
            "year": data['year'],
            "planted_area_acres": data['planted_area_acres'],
            "harvested_yield_quintals": data.get('harvested_yield_quintals', 0.0),
            "status": data['status'],
            "notes": data.get('notes', ''),
            "updated_at": now,
        }

        if data.get('harvest_date'):
            h_date = data['harvest_date']
            update_fields['harvest_date'] = datetime(h_date.year, h_date.month, h_date.day, tzinfo=timezone.utc)

        crop_history_col().update_one({"_id": history['_id']}, {"$set": update_fields})
        updated = crop_history_col().find_one({"_id": history['_id']})

        return api_response(
            success=True,
            message="Crop cultivation record updated.",
            data=serialize_doc(updated)
        )

    def delete(self, request, history_id):
        history, err_resp = self._get_history(history_id, request.user)
        if err_resp:
            return err_resp

        crop_history_col().delete_one({"_id": history['_id']})
        return api_response(success=True, message="Cultivation record deleted successfully.")
