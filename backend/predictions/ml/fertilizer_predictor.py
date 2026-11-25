"""
Fertilizer Recommendation Prediction Utility.
Loads the serialized Random Forest Classifier Pipeline once at runtime and performs inference.
"""

import os
import joblib
import pandas as pd
from django.conf import settings

_fertilizer_model_cache = None

FERTILIZER_GUIDELINES = {
    "Urea": "High Nitrogen deficiency detected (46% N). Apply Urea in split doses: basal dose at sowing and top dressing during vegetative growth. Avoid over-application near plant roots.",
    "DAP": "Diammonium Phosphate (18-46-0). Primary source of Phosphorus for root establishment. Apply as basal dose before or at the time of sowing.",
    "17-17-17": "Balanced NPK complex fertilizer. Ideal for general soil maintenance and basal application across vegetables, pulses, and cereals.",
    "10-26-26": "High Potassium and Phosphorus formulation. Best suited for root crops, sugarcane, oilseeds, and fruits to boost disease resistance and grain filling.",
    "14-35-14": "Phosphorus-rich formulation for early seedling vigor and flowering stage development.",
    "28-28-0": "Nitrogen and Phosphate blend. Recommended for cereal crops during early tillering and leaf formation.",
    "20-20": "Standard balanced starter fertilizer. Suitable for moderately balanced soils to support steady seasonal crop growth."
}


def get_fertilizer_model():
    global _fertilizer_model_cache
    if _fertilizer_model_cache is None:
        models_dir = getattr(settings, 'ML_MODELS_DIR', None)
        if not models_dir:
            models_dir = os.path.join(settings.BASE_DIR.parent, 'ml', 'saved_models')
        model_path = os.path.join(models_dir, 'fertilizer_recommendation.joblib')

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Fertilizer model artifact not found at: {model_path}")

        _fertilizer_model_cache = joblib.load(model_path)
    return _fertilizer_model_cache


def predict_fertilizer(nitrogen: float, phosphorus: float, potassium: float, temperature: float = 26.0, humidity: float = 60.0, moisture: float = 35.0, soil_type: str = "Loamy", crop_type: str = "Wheat"):
    """
    Predicts the optimal fertilizer formulation based on soil nutrient ratios and environmental parameters.
    """
    artifact = get_fertilizer_model()
    pipeline = artifact['pipeline']

    # Standardize categories
    soil_type_clean = soil_type.strip().capitalize()
    crop_type_clean = crop_type.strip().capitalize()

    input_df = pd.DataFrame([{
        "Nitrogen": float(nitrogen),
        "Phosphorus": float(phosphorus),
        "Potassium": float(potassium),
        "Temperature": float(temperature),
        "Humidity": float(humidity),
        "Moisture": float(moisture),
        "Soil_Type": soil_type_clean,
        "Crop_Type": crop_type_clean
    }])

    predicted_fertilizer = str(pipeline.predict(input_df)[0])

    probabilities = pipeline.predict_proba(input_df)[0]
    classes = pipeline.named_steps['classifier'].classes_
    best_prob = round(float(max(probabilities)) * 100, 2)

    guidelines = FERTILIZER_GUIDELINES.get(
        predicted_fertilizer,
        "Apply recommended dosage in consultation with local agricultural extension officer."
    )

    return {
        "recommended_fertilizer": predicted_fertilizer,
        "confidence_percentage": best_prob,
        "application_guidelines": guidelines,
        "soil_analysis": {
            "nitrogen_level": "Low" if nitrogen < 35 else ("Optimal" if nitrogen <= 90 else "High"),
            "phosphorus_level": "Low" if phosphorus < 25 else ("Optimal" if phosphorus <= 60 else "High"),
            "potassium_level": "Low" if potassium < 25 else ("Optimal" if potassium <= 60 else "High"),
        },
        "disclaimer": "Machine learning prediction based on regional agronomic models. Always verify with certified local soil test laboratories."
    }
