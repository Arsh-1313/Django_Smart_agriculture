"""
Automated unit and integration tests for ML Prediction Endpoints.
Verifies actual model inference execution and MongoDB logging for:
1. Crop Recommendation (Random Forest Classifier)
2. Yield Prediction (Random Forest Regressor)
3. Fertilizer Advice (Random Forest Classifier)
4. Crop Disease Detection (TensorFlow Keras CNN)
"""

import io
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from common.db import (
    users_col,
    crop_predictions_col,
    yield_predictions_col,
    disease_detections_col,
)


class PredictionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        users_col().delete_many({})
        crop_predictions_col().delete_many({})
        yield_predictions_col().delete_many({})
        disease_detections_col().delete_many({})

        # Register Farmer
        reg_res = self.client.post('/api/auth/register/', {
            "username": "ml_farmer",
            "email": "farmer_ml@agri.org",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "role": "farmer"
        }, format='json')
        self.token = reg_res.json()['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_crop_recommendation_inference(self):
        # Rice profile input: N=80, P=48, K=40, temp=24, humidity=82, ph=6.4, rainfall=230
        payload = {
            "N": 80.0,
            "P": 48.0,
            "K": 40.0,
            "temperature": 24.0,
            "humidity": 82.0,
            "ph": 6.4,
            "rainfall": 230.0
        }
        res = self.client.post('/api/predictions/crop/', payload, format='json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('recommended_crop', data['data'])
        self.assertEqual(data['data']['recommended_crop'].lower(), 'rice')
        self.assertGreater(data['data']['confidence'], 50.0)

        # Verify inference logged in MongoDB
        log = crop_predictions_col().find_one({"recommended_crop": "Rice"})
        self.assertIsNotNone(log)
        self.assertEqual(log['inputs']['N'], 80.0)

    def test_yield_prediction_inference(self):
        payload = {
            "crop": "Wheat",
            "state": "Punjab",
            "season": "Rabi",
            "area_acres": 5.0,
            "annual_rainfall_mm": 650.0,
            "fertilizer_kg_per_acre": 120.0
        }
        res = self.client.post('/api/predictions/yield/', payload, format='json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertGreater(data['data']['predicted_yield_per_acre'], 0)
        self.assertGreater(data['data']['total_estimated_production_quintals'], 0)

        # Verify logged in MongoDB
        log = yield_predictions_col().find_one({"crop_name": "Wheat"})
        self.assertIsNotNone(log)
        self.assertEqual(log['area_acres'], 5.0)

    def test_fertilizer_recommendation_inference(self):
        # High N deficit -> should recommend Urea
        payload = {
            "nitrogen": 15.0,
            "phosphorus": 45.0,
            "potassium": 40.0,
            "soil_type": "Loamy",
            "crop_type": "Wheat",
            "temperature": 25.0,
            "humidity": 60.0,
            "moisture": 35.0
        }
        res = self.client.post('/api/predictions/fertilizer/', payload, format='json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['recommended_fertilizer'], 'Urea')
        self.assertIn('application_guidelines', data['data'])

    def test_crop_disease_detection_inference(self):
        # Generate an in-memory test leaf image
        img = Image.new('RGB', (64, 64), color=(60, 180, 50))
        img_io = io.BytesIO()
        img.save(img_io, format='PNG')
        img_io.seek(0)
        uploaded_file = SimpleUploadedFile("leaf_sample.png", img_io.read(), content_type="image/png")

        res = self.client.post('/api/disease/detect/', {'image': uploaded_file}, format='multipart')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        result = data['data']
        self.assertIn('predicted_class', result)
        self.assertIn('confidence', result)
        self.assertIn('organic_treatment', result)
        self.assertIn('chemical_control', result)
        self.assertIn('agronomic_disclaimer', result)

        # Verify scan logged in MongoDB disease_detections collection
        log = disease_detections_col().find_one()
        self.assertIsNotNone(log)
        self.assertEqual(log['image_filename'], 'leaf_sample.png')

        # Test disease history endpoint
        hist_res = self.client.get('/api/disease/history/')
        self.assertEqual(hist_res.status_code, 200)
        self.assertEqual(len(hist_res.json()['data']), 1)

    def test_prediction_history(self):
        # Make a crop prediction
        self.client.post('/api/predictions/crop/', {
            "N": 75.0, "P": 45.0, "K": 20.0, "temperature": 23.0, "humidity": 65.0, "ph": 6.2, "rainfall": 85.0
        }, format='json')

        hist_res = self.client.get('/api/predictions/history/')
        self.assertEqual(hist_res.status_code, 200)
        data = hist_res.json()['data']
        self.assertGreaterEqual(len(data['crop_recommendations']), 1)
