"""
Crop Recommendation Prediction Utility.
Loads the serialized Random Forest Classifier once at runtime and performs inference.
"""

import os
import joblib
import pandas as pd
from django.conf import settings

_crop_model_cache = None


def get_crop_model():
    global _crop_model_cache
    if _crop_model_cache is None:
        models_dir = getattr(settings, 'ML_MODELS_DIR', None)
        if not models_dir:
            models_dir = os.path.join(settings.BASE_DIR.parent, 'ml', 'saved_models')
        model_path = os.path.join(models_dir, 'crop_recommendation.joblib')

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Crop model artifact not found at: {model_path}")

        _crop_model_cache = joblib.load(model_path)
    return _crop_model_cache


def predict_crop(n: float, p: float, k: float, temperature: float, humidity: float, ph: float, rainfall: float):
    """
    Predicts the optimal crop given soil nutrients and environmental parameters.
    Returns: dict with recommended_crop, confidence, and top-3 ranked alternatives.
    """
    artifact = get_crop_model()
    model = artifact['model']
    features = artifact['features']

    input_df = pd.DataFrame([{
        'N': n,
        'P': p,
        'K': k,
        'temperature': temperature,
        'humidity': humidity,
        'ph': ph,
        'rainfall': rainfall
    }])[features]

    # Predict class
    prediction = model.predict(input_df)[0]

    # Predict probabilities
    probabilities = model.predict_proba(input_df)[0]
    classes = model.classes_

    # Sort probabilities descending
    ranked_indices = probabilities.argsort()[::-1]
    top_recommendations = []
    for idx in ranked_indices[:3]:
        crop_name = str(classes[idx]).capitalize()
        prob = round(float(probabilities[idx]) * 100, 2)
        top_recommendations.append({
            "crop": crop_name,
            "confidence_percentage": prob
        })

    primary_confidence = top_recommendations[0]["confidence_percentage"]

    return {
        "recommended_crop": str(prediction).capitalize(),
        "confidence": primary_confidence,
        "top_alternatives": top_recommendations,
        "input_parameters": {
            "N": n, "P": p, "K": k,
            "temperature": temperature,
            "humidity": humidity,
            "ph": ph,
            "rainfall": rainfall
        }
    }
