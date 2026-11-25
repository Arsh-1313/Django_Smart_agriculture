"""
Crop Disease Vision Prediction Utility.
Loads the serialized Keras CNN model, preprocesses leaf images,
performs inference, and formats actionable agronomic remedies with safety disclaimers.
"""

import os
import json
import numpy as np
from PIL import Image
from django.conf import settings

_disease_model_cache = None
_disease_classes_cache = None


DISEASE_KNOWLEDGE_BASE = {
    'Tomato___Early_blight': {
        'display_name': 'Tomato - Early Blight',
        'crop': 'Tomato',
        'condition': 'Early Blight',
        'pathogen': 'Alternaria solani (Fungus)',
        'urgency': 'High',
        'symptoms': [
            'Dark brown to black necrotic spots with concentric rings ("target board" pattern).',
            'Chlorotic yellow halos surrounding spots on older lower leaves.',
            'Gradual upward defoliation and sunken stem cankers.'
        ],
        'organic_treatment': [
            'Foliar spray of 1% Bordeaux mixture or Copper oxychloride (2.5 g/L).',
            'Spray 5% Neem Seed Kernel Extract (NSKE) or Trichoderma viride bio-fungicide.',
            'Prune and destroy severely infected lower leaves immediately.'
        ],
        'chemical_control': [
            'Mancozeb 75% WP @ 2 g/L of water at 10-day intervals.',
            'Chlorothalonil 75% WP @ 2 g/L of water.',
            'Azoxystrobin 23% SC @ 1 ml/L during initial lesion onset.'
        ],
        'preventative_measures': [
            'Adopt drip irrigation to keep leaf surfaces dry.',
            'Maintain minimum 60 cm inter-plant spacing for canopy ventilation.',
            'Rotate crops every 2-3 seasons with non-solanaceous species (e.g. maize, legumes).'
        ]
    },
    'Tomato___Late_blight': {
        'display_name': 'Tomato - Late Blight',
        'crop': 'Tomato',
        'condition': 'Late Blight',
        'pathogen': 'Phytophthora infestans (Oomycete)',
        'urgency': 'Critical',
        'symptoms': [
            'Irregular, water-soaked pale green to dark brown lesions on leaf margins.',
            'White cottony fungal growth visible on undersides of leaves during high humidity.',
            'Rapid collapse of foliage and brown rot of green and ripening fruits.'
        ],
        'organic_treatment': [
            'Preventative copper hydroxide or copper sulfate spray before wet weather spells.',
            'Remove and bury or burn all infected vines; do not compost blighted residues.'
        ],
        'chemical_control': [
            'Metalaxyl + Mancozeb (Ridomil Gold) @ 2.5 g/L of water.',
            'Cymoxanil 8% + Mancozeb 64% WP @ 2 g/L.',
            'Dimethomorph 50% WP @ 1 g/L as systemic curative treatment.'
        ],
        'preventative_measures': [
            'Plant certified disease-free transplants.',
            'Avoid planting tomatoes immediately adjacent to potato fields.',
            'Ensure raised bed drainage during rainy seasons.'
        ]
    },
    'Tomato___healthy': {
        'display_name': 'Tomato - Healthy Foliage',
        'crop': 'Tomato',
        'condition': 'Healthy',
        'pathogen': 'None (Pathogen-free)',
        'urgency': 'None',
        'symptoms': [
            'Uniform vibrant green foliage with no necrotic spots, yellow halos, or fungal spore growth.',
            'Sturdy stems and vigorous vegetative development.'
        ],
        'organic_treatment': [
            'Maintain regular application of compost and bio-fertilizers (Azotobacter, PSB).'
        ],
        'chemical_control': [
            'No chemical sprays required.'
        ],
        'preventative_measures': [
            'Continue routine pest and disease scouting twice weekly.',
            'Maintain balanced N-P-K nutrient supply based on soil testing.'
        ]
    },
    'Potato___Early_blight': {
        'display_name': 'Potato - Early Blight',
        'crop': 'Potato',
        'condition': 'Early Blight',
        'pathogen': 'Alternaria solani (Fungus)',
        'urgency': 'Moderate',
        'symptoms': [
            'Small brown angular spots developing characteristic target-ring patterns.',
            'Senescence and drying of lower canopy leaves, reducing tuber size.'
        ],
        'organic_treatment': [
            'Copper oxychloride 50 WP @ 3 g/L foliar spray.',
            'Soil application of Trichoderma harzianum enriched farmyard manure.'
        ],
        'chemical_control': [
            'Mancozeb 75% WP @ 2.5 g/L or Propineb 70% WP @ 2 g/L of water.',
            'Pyraclostrobin 20% WG @ 1 g/L.'
        ],
        'preventative_measures': [
            'Avoid excess nitrogen fertilizer which creates lush, susceptible foliage.',
            'Practice timely earthing up of potato ridges.'
        ]
    },
    'Potato___Late_blight': {
        'display_name': 'Potato - Late Blight',
        'crop': 'Potato',
        'condition': 'Late Blight',
        'pathogen': 'Phytophthora infestans (Oomycete)',
        'urgency': 'Critical',
        'symptoms': [
            'Water-soaked dark lesions expanding rapidly over leaf tips and margins.',
            'Stem rotting accompanied by foul odor in humid weather.',
            'Purplish-brown dry rot penetrating into tuber flesh.'
        ],
        'organic_treatment': [
            'Prophylactic spray of Bordeaux mixture before fog or rainfall onset.',
            'Immediate haulm cutting (dehaulming) if infection reaches 20% to save tubers.'
        ],
        'chemical_control': [
            'Cymoxanil + Mancozeb (Curzate) @ 2 g/L of water.',
            'Fenamidone 10% + Mancozeb 50% WG @ 2.5 g/L.'
        ],
        'preventative_measures': [
            'Use certified disease-free seed tubers from trusted state seed corporations.',
            'Deep earthing up to prevent zoospores from washing down into tubers.'
        ]
    },
    'Potato___healthy': {
        'display_name': 'Potato - Healthy Foliage',
        'crop': 'Potato',
        'condition': 'Healthy',
        'pathogen': 'None',
        'urgency': 'None',
        'symptoms': [
            'Clean green leaf blades with no blighted spots or leaf curl symptoms.'
        ],
        'organic_treatment': ['Standard organic cultivation practices.'],
        'chemical_control': ['None needed.'],
        'preventative_measures': ['Inspect field regularly for early signs of late blight in cool humid periods.']
    },
    'Corn_(Maize)___Common_rust': {
        'display_name': 'Maize (Corn) - Common Rust',
        'crop': 'Maize',
        'condition': 'Common Rust',
        'pathogen': 'Puccinia sorghi (Fungus)',
        'urgency': 'Moderate',
        'symptoms': [
            'Golden-brown to cinnamon elongated powdery pustules on both leaf surfaces.',
            'Ruptured leaf epidermis releasing reddish-brown urediniospores.'
        ],
        'organic_treatment': [
            'Sulfur-based dust or wettable sulfur (3 g/L) at first symptom appearance.'
        ],
        'chemical_control': [
            'Propiconazole 25% EC (Tilt) @ 1 ml/L of water.',
            'Mancozeb 75% WP @ 2 g/L.'
        ],
        'preventative_measures': [
            'Plant rust-resistant single cross maize hybrids.',
            'Early planting to avoid peak rust spore migration periods.'
        ]
    },
    'Corn_(Maize)___Northern_Leaf_Blight': {
        'display_name': 'Maize (Corn) - Northern Leaf Blight',
        'crop': 'Maize',
        'condition': 'Northern Leaf Blight',
        'pathogen': 'Exserohilum turcicum (Fungus)',
        'urgency': 'High',
        'symptoms': [
            'Long, elliptical cigar-shaped grayish-green to tan lesions (2.5 to 15 cm long).',
            'Coalescence of lesions leading to extensive foliage scorching.'
        ],
        'organic_treatment': [
            'Neem oil foliar sprays and shredding/plowing under crop stubble post-harvest.'
        ],
        'chemical_control': [
            'Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L.',
            'Carbendazim 50% WP @ 1 g/L.'
        ],
        'preventative_measures': [
            'Ensure balanced potassium fertilization.',
            'Rotate with non-host crops like pulses or oilseeds.'
        ]
    },
    'Corn_(Maize)___healthy': {
        'display_name': 'Maize (Corn) - Healthy Blade',
        'crop': 'Maize',
        'condition': 'Healthy',
        'pathogen': 'None',
        'urgency': 'None',
        'symptoms': ['Uniform green leaves with no rust pustules or elliptical blight lesions.'],
        'organic_treatment': ['Maintain soil organic matter.'],
        'chemical_control': ['None needed.'],
        'preventative_measures': ['Ensure adequate drainage during monsoon vegetative stages.']
    },
    'Pepper__bell___Bacterial_spot': {
        'display_name': 'Bell Pepper (Capsicum) - Bacterial Spot',
        'crop': 'Bell Pepper',
        'condition': 'Bacterial Spot',
        'pathogen': 'Xanthomonas campestris pv. vesicatoria',
        'urgency': 'High',
        'symptoms': [
            'Small, dark, water-soaked spots on leaves and fruit with ragged margins.',
            'Severe leaf drop causing sunscald injury on exposed peppers.'
        ],
        'organic_treatment': [
            'Copper hydroxide spray combined with agricultural streptomycin (Streptocycline 100 ppm).'
        ],
        'chemical_control': [
            'Copper oxychloride (2.5 g/L) + Streptocycline (0.1 g/L of water).'
        ],
        'preventative_measures': [
            'Hot water treat seeds at 50°C for 25 minutes prior to nursery sowing.',
            'Avoid handling or staking plants when leaves are wet.'
        ]
    },
    'Pepper__bell___healthy': {
        'display_name': 'Bell Pepper - Healthy Leaf',
        'crop': 'Bell Pepper',
        'condition': 'Healthy',
        'pathogen': 'None',
        'urgency': 'None',
        'symptoms': ['Glossy, dark green leaves free of bacterial lesions or mosaic mottle.'],
        'organic_treatment': ['Regular vermicompost mulching.'],
        'chemical_control': ['None needed.'],
        'preventative_measures': ['Scout regularly for aphid and whitefly vectors.']
    },
    'Apple___Apple_scab': {
        'display_name': 'Apple - Apple Scab',
        'crop': 'Apple',
        'condition': 'Apple Scab',
        'pathogen': 'Venturia inaequalis (Fungus)',
        'urgency': 'High',
        'symptoms': [
            'Velvety, olive-green to dark brown circular spots with indistinct margins on leaves.',
            'Scabby, corky, cracked lesions developing on fruit surface.'
        ],
        'organic_treatment': [
            'Lime sulfur or liquid sulfur spray during green tip and pink bud stages.'
        ],
        'chemical_control': [
            'Difenoconazole 25% EC @ 0.3 ml/L or Captan 50% WP @ 2.5 g/L of water.',
            'Mancozeb 75% WP @ 2 g/L.'
        ],
        'preventative_measures': [
            'Rake and destroy fallen orchard leaves in autumn to eliminate overwintering ascocarps.',
            'Prune tree canopy for optimal sunlight penetration and airflow.'
        ]
    }
}

DEFAULT_ADVICE = {
    'display_name': 'Unclassified Foliar Condition',
    'crop': 'General Field Crop',
    'condition': 'Suspected Pathogen',
    'pathogen': 'Under Observation',
    'urgency': 'Moderate',
    'symptoms': ['Discolored leaf patches or atypical foliar spotting.'],
    'organic_treatment': ['Apply broad-spectrum neem-based bio-repellent and isolate plant.'],
    'chemical_control': ['Consult local Krishi Vigyan Kendra extension officer.'],
    'preventative_measures': ['Ensure sanitary farm conditions and quarantine infected specimens.']
}

AGRONOMIC_DISCLAIMER = (
    "IMPORTANT AGRONOMIC CAUTION: This diagnosis is generated by an artificial intelligence "
    "computer vision model trained on plant pathology datasets. It is provided for informational and "
    "preliminary scouting purposes only. Do not apply heavy chemical pesticides without confirming diagnosis "
    "with a certified agronomist or your local Krishi Vigyan Kendra (KVK) agricultural extension officer."
)


def get_disease_model():
    """
    Singleton model loader for the Keras Crop Disease CNN.
    """
    global _disease_model_cache, _disease_classes_cache
    if _disease_model_cache is None:
        models_dir = getattr(settings, 'ML_MODELS_DIR', None)
        if not models_dir:
            models_dir = os.path.join(settings.BASE_DIR.parent, 'ml', 'saved_models')

        model_path = os.path.join(models_dir, 'crop_disease_model.keras')
        meta_path = os.path.join(models_dir, 'disease_classes.json')

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Disease model not found at: {model_path}")
        if not os.path.exists(meta_path):
            raise FileNotFoundError(f"Disease classes metadata not found at: {meta_path}")

        import tensorflow as tf
        _disease_model_cache = tf.keras.models.load_model(model_path)
        with open(meta_path, 'r') as f:
            meta = json.load(f)
            _disease_classes_cache = meta['classes']

    return _disease_model_cache, _disease_classes_cache


def predict_disease_from_image(image_file):
    """
    Takes an uploaded file object or PIL Image, normalizes it,
    performs CNN inference, and attaches detailed agronomic treatment advice.
    """
    model, classes = get_disease_model()

    # Load and preprocess with PIL
    img = Image.open(image_file).convert('RGB')
    target_size = (64, 64)
    img = img.resize(target_size)
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_tensor = np.expand_dims(img_array, axis=0)

    # Predict class probabilities
    probabilities = model.predict(img_tensor, verbose=0)[0]
    top_idx = int(np.argmax(probabilities))
    confidence = float(probabilities[top_idx]) * 100.0
    predicted_class = classes[top_idx]

    # Top-3 alternatives
    sorted_indices = np.argsort(probabilities)[::-1]
    top_alternatives = []
    for idx in sorted_indices[1:4]:
        c_name = classes[idx]
        info = DISEASE_KNOWLEDGE_BASE.get(c_name, {})
        top_alternatives.append({
            'class': c_name,
            'name': info.get('display_name', c_name),
            'confidence': round(float(probabilities[idx]) * 100.0, 2)
        })

    advice = DISEASE_KNOWLEDGE_BASE.get(predicted_class, DEFAULT_ADVICE)

    return {
        'predicted_class': predicted_class,
        'display_name': advice.get('display_name', predicted_class),
        'crop': advice.get('crop', 'Crop'),
        'condition': advice.get('condition', 'Condition'),
        'pathogen': advice.get('pathogen', 'N/A'),
        'urgency': advice.get('urgency', 'Moderate'),
        'confidence': round(confidence, 2),
        'is_healthy': 'healthy' in predicted_class.lower(),
        'symptoms': advice.get('symptoms', []),
        'organic_treatment': advice.get('organic_treatment', []),
        'chemical_control': advice.get('chemical_control', []),
        'preventative_measures': advice.get('preventative_measures', []),
        'top_alternatives': top_alternatives,
        'agronomic_disclaimer': AGRONOMIC_DISCLAIMER
    }
