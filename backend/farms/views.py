"""
Farm Management and Soil Testing Views.
All operations interact with MongoDB Atlas via PyMongo.
"""

from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework import status
from pymongo import DESCENDING

from common.db import (
    farms_col,
    soil_details_col,
    crop_history_col,
)
from common.permissions import IsFarmer, IsAuthenticatedMongo
from common.utils import api_response, serialize_doc, parse_object_id
from farms.serializers import (
    FarmCreateUpdateSerializer,
    SoilDetailSerializer,
)


class FarmListCreateView(APIView):
    """
    GET: List all farms owned by the current farmer (or all farms if Admin).
    POST: Register a new farm with GPS coordinates and acreage.
    """
    permission_classes = [IsFarmer]

    def get(self, request):
        user = request.user
        query = {}
        if user.role != 'admin':
            query['farmer_id'] = user.object_id

        farms_cursor = farms_col().find(query).sort('created_at', DESCENDING)
        farms_list = []
        for farm in farms_cursor:
            farm_clean = serialize_doc(farm)
            # Add latest soil test indicator
            latest_soil = soil_details_col().find_one(
                {"farm_id": farm['_id']},
                sort=[("recorded_date", DESCENDING)]
            )
            farm_clean['latest_soil'] = serialize_doc(latest_soil)
            farms_list.append(farm_clean)

        return api_response(
            success=True,
            data=farms_list,
            message=f"Retrieved {len(farms_list)} farm(s)."
        )

    def post(self, request):
        serializer = FarmCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid farm registration details.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        now = datetime.now(timezone.utc)

        farm_doc = {
            "farmer_id": request.user.object_id,
            "farm_name": data['farm_name'],
            "total_area_acres": data['total_area_acres'],
            "location": {
                "type": "Point",
                "coordinates": [data['longitude'], data['latitude']]  # [lng, lat] GeoJSON format
            },
            "village": data['village'],
            "district": data['district'],
            "state": data['state'],
            "pin_code": data.get('pin_code', ''),
            "irrigation_type": data['irrigation_type'],
            "created_at": now,
            "updated_at": now,
        }

        result = farms_col().insert_one(farm_doc)
        farm_doc['_id'] = result.inserted_id

        return api_response(
            success=True,
            message="Farm registered successfully.",
            data=serialize_doc(farm_doc),
            status_code=status.HTTP_201_CREATED
        )


class FarmDetailView(APIView):
    """
    GET: Details of a specific farm, including active crop cycles and soil summary.
    PUT: Update farm parameters.
    DELETE: Remove a farm.
    """
    permission_classes = [IsFarmer]

    def _get_farm(self, farm_id_str, user):
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
        farm, error_response = self._get_farm(farm_id, request.user)
        if error_response:
            return error_response

        farm_data = serialize_doc(farm)

        # Attach latest soil test record
        latest_soil = soil_details_col().find_one(
            {"farm_id": farm['_id']},
            sort=[("recorded_date", DESCENDING)]
        )
        farm_data['latest_soil'] = serialize_doc(latest_soil)

        # Attach active crop count
        active_crops_count = crop_history_col().count_documents({
            "farm_id": farm['_id'],
            "status": "planted"
        })
        farm_data['active_crops_count'] = active_crops_count

        return api_response(success=True, data=farm_data)

    def put(self, request, farm_id):
        farm, error_response = self._get_farm(farm_id, request.user)
        if error_response:
            return error_response

        serializer = FarmCreateUpdateSerializer(data=request.data)
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
            "farm_name": data['farm_name'],
            "total_area_acres": data['total_area_acres'],
            "location": {
                "type": "Point",
                "coordinates": [data['longitude'], data['latitude']]
            },
            "village": data['village'],
            "district": data['district'],
            "state": data['state'],
            "pin_code": data.get('pin_code', ''),
            "irrigation_type": data['irrigation_type'],
            "updated_at": now,
        }

        farms_col().update_one({"_id": farm['_id']}, {"$set": update_fields})
        updated_farm = farms_col().find_one({"_id": farm['_id']})

        return api_response(
            success=True,
            message="Farm updated successfully.",
            data=serialize_doc(updated_farm)
        )

    def delete(self, request, farm_id):
        farm, error_response = self._get_farm(farm_id, request.user)
        if error_response:
            return error_response

        farms_col().delete_one({"_id": farm['_id']})
        # Clean up related soil details and history
        soil_details_col().delete_many({"farm_id": farm['_id']})
        crop_history_col().delete_many({"farm_id": farm['_id']})

        return api_response(
            success=True,
            message="Farm and related records deleted successfully."
        )


class FarmSoilListCreateView(APIView):
    """
    GET: Historical soil tests for a specific farm.
    POST: Record a new soil test for a farm.
    """
    permission_classes = [IsFarmer]

    def _get_farm(self, farm_id_str, user):
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
        farm, err_resp = self._get_farm(farm_id, request.user)
        if err_resp:
            return err_resp

        soil_records = list(soil_details_col().find({"farm_id": farm['_id']}).sort("recorded_date", DESCENDING))
        return api_response(
            success=True,
            data=serialize_doc(soil_records),
            message=f"Retrieved {len(soil_records)} soil test record(s)."
        )

    def post(self, request, farm_id):
        farm, err_resp = self._get_farm(farm_id, request.user)
        if err_resp:
            return err_resp

        serializer = SoilDetailSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid soil test data.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        now = datetime.now(timezone.utc)
        rec_date = data.get('recorded_date')
        if rec_date:
            rec_datetime = datetime(rec_date.year, rec_date.month, rec_date.day, tzinfo=timezone.utc)
        else:
            rec_datetime = now

        soil_doc = {
            "farm_id": farm['_id'],
            "farmer_id": request.user.object_id,
            "nitrogen_N": data['nitrogen_N'],
            "phosphorus_P": data['phosphorus_P'],
            "potassium_K": data['potassium_K'],
            "pH": data['pH'],
            "soil_type": data['soil_type'],
            "organic_carbon_percent": data.get('organic_carbon_percent', 0.5),
            "moisture_percent": data.get('moisture_percent', 25.0),
            "recorded_date": rec_datetime,
            "created_at": now,
        }

        res = soil_details_col().insert_one(soil_doc)
        soil_doc['_id'] = res.inserted_id

        return api_response(
            success=True,
            message="Soil test record saved successfully.",
            data=serialize_doc(soil_doc),
            status_code=status.HTTP_201_CREATED
        )


class FarmLatestSoilView(APIView):
    """
    GET: Returns the most recent soil test for a farm (used by ML prediction modules).
    """
    permission_classes = [IsFarmer]

    def get(self, request, farm_id):
        farm_oid, err = parse_object_id(farm_id)
        if err:
            return api_response(success=False, message=err, status_code=status.HTTP_400_BAD_REQUEST)

        latest_soil = soil_details_col().find_one(
            {"farm_id": farm_oid},
            sort=[("recorded_date", DESCENDING)]
        )
        if not latest_soil:
            return api_response(
                success=False,
                message="No soil records found for this farm.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return api_response(
            success=True,
            data=serialize_doc(latest_soil),
            message="Retrieved latest soil test."
        )


class SoilDetailView(APIView):
    """
    GET / PUT / DELETE a specific soil record by ID.
    """
    permission_classes = [IsFarmer]

    def _get_soil(self, soil_id_str, user):
        soil_oid, err = parse_object_id(soil_id_str)
        if err:
            return None, api_response(success=False, message=err, status_code=status.HTTP_400_BAD_REQUEST)
        query = {"_id": soil_oid}
        if user.role != 'admin':
            query["farmer_id"] = user.object_id
        soil = soil_details_col().find_one(query)
        if not soil:
            return None, api_response(success=False, message="Soil record not found or access denied.", status_code=status.HTTP_404_NOT_FOUND)
        return soil, None

    def get(self, request, soil_id):
        soil, err_resp = self._get_soil(soil_id, request.user)
        if err_resp:
            return err_resp
        return api_response(success=True, data=serialize_doc(soil))

    def put(self, request, soil_id):
        soil, err_resp = self._get_soil(soil_id, request.user)
        if err_resp:
            return err_resp

        serializer = SoilDetailSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        update_fields = {
            "nitrogen_N": data['nitrogen_N'],
            "phosphorus_P": data['phosphorus_P'],
            "potassium_K": data['potassium_K'],
            "pH": data['pH'],
            "soil_type": data['soil_type'],
            "organic_carbon_percent": data.get('organic_carbon_percent', soil.get('organic_carbon_percent', 0.5)),
            "moisture_percent": data.get('moisture_percent', soil.get('moisture_percent', 25.0)),
            "updated_at": datetime.now(timezone.utc),
        }

        soil_details_col().update_one({"_id": soil['_id']}, {"$set": update_fields})
        updated = soil_details_col().find_one({"_id": soil['_id']})
        return api_response(success=True, message="Soil record updated.", data=serialize_doc(updated))

    def delete(self, request, soil_id):
        soil, err_resp = self._get_soil(soil_id, request.user)
        if err_resp:
            return err_resp

        soil_details_col().delete_one({"_id": soil['_id']})
        return api_response(success=True, message="Soil record deleted successfully.")
