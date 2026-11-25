"""
REST API Views for Machine Learning Inference.
Integrates trained Random Forest models for:
1. Crop Recommendation (POST /api/predictions/crop/)
2. Crop Yield Prediction (POST /api/predictions/yield/)
3. Fertilizer Recommendation (POST /api/predictions/fertilizer/)
Logs inference results directly into MongoDB collections.
"""

from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework import status
from pymongo import DESCENDING

from common.db import (
    crop_predictions_col,
    yield_predictions_col,
    disease_detections_col,
    farms_col,
)
from common.permissions import IsFarmer, IsAuthenticatedMongo
from common.utils import api_response, serialize_doc, parse_object_id
from predictions.serializers import (
    CropPredictionInputSerializer,
    YieldPredictionInputSerializer,
    FertilizerPredictionInputSerializer,
)
from predictions.ml.crop_predictor import predict_crop
from predictions.ml.yield_predictor import predict_yield
from predictions.ml.fertilizer_predictor import predict_fertilizer
from predictions.ml.disease_predictor import predict_disease_from_image


class CropPredictionView(APIView):
    """
    POST: Generates an AI crop recommendation based on N, P, K, pH, and climate telemetry.
    Logs inference output to MongoDB `crop_predictions` collection.
    """
    permission_classes = [IsFarmer]

    def post(self, request):
        serializer = CropPredictionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid soil or environmental parameters.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            result = predict_crop(
                n=data['N'],
                p=data['P'],
                k=data['K'],
                temperature=data['temperature'],
                humidity=data['humidity'],
                ph=data['ph'],
                rainfall=data['rainfall']
            )

            # Log prediction to MongoDB
            farm_oid = None
            if data.get('farm_id'):
                f_oid, _ = parse_object_id(data['farm_id'])
                farm_oid = f_oid

            now = datetime.now(timezone.utc)
            log_doc = {
                "farmer_id": request.user.object_id,
                "farm_id": farm_oid,
                "inputs": {
                    "N": data['N'],
                    "P": data['P'],
                    "K": data['K'],
                    "temperature": data['temperature'],
                    "humidity": data['humidity'],
                    "ph": data['ph'],
                    "rainfall": data['rainfall']
                },
                "recommended_crop": result['recommended_crop'],
                "confidence_scores": result['top_alternatives'],
                "predicted_at": now,
            }
            res = crop_predictions_col().insert_one(log_doc)
            result['prediction_id'] = str(res.inserted_id)

            return api_response(
                success=True,
                message=f"Optimal crop recommended: {result['recommended_crop']}",
                data=result
            )
        except Exception as e:
            return api_response(
                success=False,
                message=f"Inference error: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class YieldPredictionView(APIView):
    """
    POST: Estimates harvest yield per acre and total production using historical regression models.
    Logs output to MongoDB `yield_predictions` collection.
    """
    permission_classes = [IsFarmer]

    def post(self, request):
        serializer = YieldPredictionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid yield prediction parameters.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            result = predict_yield(
                crop=data['crop'],
                state=data['state'],
                season=data['season'],
                area_acres=data['area_acres'],
                annual_rainfall_mm=data.get('annual_rainfall_mm', 1000.0),
                fertilizer_kg_per_acre=data.get('fertilizer_kg_per_acre', 100.0),
            )

            farm_oid = None
            if data.get('farm_id'):
                f_oid, _ = parse_object_id(data['farm_id'])
                farm_oid = f_oid

            now = datetime.now(timezone.utc)
            log_doc = {
                "farmer_id": request.user.object_id,
                "farm_id": farm_oid,
                "crop_name": data['crop'],
                "state": data['state'],
                "season": data['season'],
                "area_acres": data['area_acres'],
                "predicted_yield_per_acre": result['predicted_yield_per_acre'],
                "predicted_total_quintals": result['total_estimated_production_quintals'],
                "predicted_at": now,
            }
            res = yield_predictions_col().insert_one(log_doc)
            result['prediction_id'] = str(res.inserted_id)

            return api_response(
                success=True,
                message=f"Estimated harvest production: {result['total_estimated_production_quintals']} Quintals",
                data=result
            )
        except Exception as e:
            return api_response(
                success=False,
                message=f"Yield inference error: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FertilizerPredictionView(APIView):
    """
    POST: Generates tailored fertilizer recommendations and nutrient deficit analysis.
    """
    permission_classes = [IsFarmer]

    def post(self, request):
        serializer = FertilizerPredictionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid soil nutrient data.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        try:
            result = predict_fertilizer(
                nitrogen=data['nitrogen'],
                phosphorus=data['phosphorus'],
                potassium=data['potassium'],
                soil_type=data.get('soil_type', 'Loamy'),
                crop_type=data.get('crop_type', 'Wheat'),
                temperature=data.get('temperature', 26.0),
                humidity=data.get('humidity', 60.0),
                moisture=data.get('moisture', 35.0),
            )

            # Log prediction
            try:
                from common.db import fertilizer_predictions_col
                fertilizer_predictions_col().insert_one({
                    "farmer_id": request.user.object_id,
                    "crop_type": data.get('crop_type', 'Wheat'),
                    "soil_type": data.get('soil_type', 'Loamy'),
                    "recommended_fertilizer": result['recommended_fertilizer'],
                    "predicted_at": datetime.now(timezone.utc),
                })
            except Exception:
                pass

            return api_response(
                success=True,
                message=f"Recommended fertilizer formulation: {result['recommended_fertilizer']}",
                data=result
            )
        except Exception as e:
            return api_response(
                success=False,
                message=f"Fertilizer inference error: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PredictionHistoryView(APIView):
    """
    GET: Retrieves the farmer's historical crop and yield prediction logs.
    """
    permission_classes = [IsFarmer]

    def get(self, request):
        farmer_id = request.user.object_id
        crop_logs = list(crop_predictions_col().find({"farmer_id": farmer_id}).sort("predicted_at", DESCENDING).limit(20))
        yield_logs = list(yield_predictions_col().find({"farmer_id": farmer_id}).sort("predicted_at", DESCENDING).limit(20))

        return api_response(
            success=True,
            data={
                "crop_recommendations": serialize_doc(crop_logs),
                "yield_predictions": serialize_doc(yield_logs),
            }
        )


class DiseaseDetectionView(APIView):
    """
    POST: Processes uploaded crop leaf image using TensorFlow CNN model.
    Diagnoses foliar pathology, computes confidence score, returns actionable organic & chemical
    remedies with safety disclaimers, and records scan into MongoDB `disease_detections` collection.
    """
    permission_classes = [IsFarmer]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return api_response(
                success=False,
                message="No leaf image file uploaded. Please provide an image file under the 'image' field.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Run CNN model inference
            result = predict_disease_from_image(image_file)

            farm_oid = None
            farm_id_str = request.data.get('farm_id')
            if farm_id_str:
                f_oid, _ = parse_object_id(farm_id_str)
                farm_oid = f_oid

            now = datetime.now(timezone.utc)
            record = {
                "farmer_id": request.user.object_id,
                "farm_id": farm_oid,
                "image_filename": image_file.name,
                "predicted_class": result['predicted_class'],
                "display_name": result['display_name'],
                "crop": result['crop'],
                "condition": result['condition'],
                "confidence": result['confidence'],
                "is_healthy": result['is_healthy'],
                "pathogen": result['pathogen'],
                "urgency": result['urgency'],
                "symptoms": result['symptoms'],
                "organic_treatment": result['organic_treatment'],
                "chemical_control": result['chemical_control'],
                "preventative_measures": result['preventative_measures'],
                "detected_at": now
            }

            insert_res = disease_detections_col().insert_one(record)
            result['detection_id'] = str(insert_res.inserted_id)

            return api_response(
                success=True,
                message=f"Leaf diagnosis complete: {result['display_name']} ({result['confidence']}% confidence)",
                data=result
            )
        except Exception as e:
            return api_response(
                success=False,
                message=f"Disease detection failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DiseaseHistoryView(APIView):
    """
    GET: Retrieves the farmer's historical leaf disease diagnosis scans.
    """
    permission_classes = [IsFarmer]

    def get(self, request):
        farmer_id = request.user.object_id
        records = list(
            disease_detections_col()
            .find({"farmer_id": farmer_id})
            .sort("detected_at", DESCENDING)
            .limit(30)
        )
        return api_response(
            success=True,
            data=serialize_doc(records),
            message=f"Retrieved {len(records)} previous disease detection records."
        )
