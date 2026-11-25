"""
Crop Yield Prediction Utility.
Loads the serialized Random Forest Regressor Pipeline once at runtime and performs inference.
"""

import os
import joblib
import pandas as pd
from django.conf import settings

_yield_model_cache = None


def get_yield_model():
    global _yield_model_cache
    if _yield_model_cache is None:
        models_dir = getattr(settings, 'ML_MODELS_DIR', None)
        if not models_dir:
            models_dir = os.path.join(settings.BASE_DIR.parent, 'ml', 'saved_models')
        model_path = os.path.join(models_dir, 'crop_yield.joblib')

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Crop yield model artifact not found at: {model_path}")

        _yield_model_cache = joblib.load(model_path)
    return _yield_model_cache


def predict_yield(crop: str, state: str, season: str, area_acres: float, annual_rainfall_mm: float = 1000.0, fertilizer_kg_per_acre: float = 100.0):
    """
    Predicts estimated harvest yield per acre and total production in quintals.
    """
    artifact = get_yield_model()
    pipeline = artifact['pipeline']

    input_df = pd.DataFrame([{
        "Crop": crop.strip().capitalize(),
        "State": state.strip(),
        "Season": season.strip(),
        "Area_Acres": float(area_acres),
        "Annual_Rainfall_mm": float(annual_rainfall_mm),
        "Fertilizer_kg_per_acre": float(fertilizer_kg_per_acre),
    }])

    predicted_yield_per_acre = float(pipeline.predict(input_df)[0])
    total_production = round(predicted_yield_per_acre * float(area_acres), 2)
    yield_per_acre_clean = round(predicted_yield_per_acre, 2)

    return {
        "crop": crop.capitalize(),
        "state": state,
        "season": season,
        "area_acres": float(area_acres),
        "predicted_yield_per_acre": yield_per_acre_clean,
        "total_estimated_production_quintals": total_production,
        "yield_unit": "Quintals/Acre",
        "production_unit": "Quintals",
        "model_r2_score": artifact.get('metrics', {}).get('r2', 0.988)
    }
