"""
Management command to seed standard agricultural crops and their optimal agronomic parameters
into the MongoDB `crops` collection.
Usage: python manage.py seed_crops
"""

from datetime import datetime, timezone
from django.core.management.base import BaseCommand
from common.db import crops_col, check_mongo_connection


STANDARD_CROPS = [
    {
        "name": "Rice",
        "category": "cereal",
        "ideal_temp_min": 20.0, "ideal_temp_max": 27.0,
        "ideal_rainfall_min": 1500.0, "ideal_rainfall_max": 3000.0,
        "ideal_ph_min": 5.0, "ideal_ph_max": 6.8,
        "growing_period_days": 130,
        "description": "Major staple cereal cultivated primarily during Kharif in warm, high-moisture tropical conditions."
    },
    {
        "name": "Wheat",
        "category": "cereal",
        "ideal_temp_min": 12.0, "ideal_temp_max": 25.0,
        "ideal_rainfall_min": 350.0, "ideal_rainfall_max": 800.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.5,
        "growing_period_days": 120,
        "description": "Crucial Rabi winter staple crop requiring temperate conditions and well-drained loamy soil."
    },
    {
        "name": "Maize",
        "category": "cereal",
        "ideal_temp_min": 18.0, "ideal_temp_max": 27.0,
        "ideal_rainfall_min": 500.0, "ideal_rainfall_max": 1000.0,
        "ideal_ph_min": 5.5, "ideal_ph_max": 7.5,
        "growing_period_days": 100,
        "description": "Versatile cereal grown for grain and fodder across diverse agro-climatic conditions."
    },
    {
        "name": "Chickpea",
        "category": "pulse",
        "ideal_temp_min": 15.0, "ideal_temp_max": 25.0,
        "ideal_rainfall_min": 600.0, "ideal_rainfall_max": 900.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 8.0,
        "growing_period_days": 110,
        "description": "Nutrient-rich Rabi pulse with high protein content and natural soil nitrogen fixation capacity."
    },
    {
        "name": "Kidney Beans",
        "category": "pulse",
        "ideal_temp_min": 15.0, "ideal_temp_max": 25.0,
        "ideal_rainfall_min": 600.0, "ideal_rainfall_max": 1200.0,
        "ideal_ph_min": 5.5, "ideal_ph_max": 6.5,
        "growing_period_days": 100,
        "description": "High-demand leguminous pulse thriving in mild temperatures and organic loamy soils."
    },
    {
        "name": "Pigeon Peas",
        "category": "pulse",
        "ideal_temp_min": 20.0, "ideal_temp_max": 35.0,
        "ideal_rainfall_min": 600.0, "ideal_rainfall_max": 1000.0,
        "ideal_ph_min": 5.0, "ideal_ph_max": 7.5,
        "growing_period_days": 180,
        "description": "Drought-hardy Kharif legume (Arhar/Tur) widely cultivated in semi-arid tropics."
    },
    {
        "name": "Moth Beans",
        "category": "pulse",
        "ideal_temp_min": 24.0, "ideal_temp_max": 32.0,
        "ideal_rainfall_min": 300.0, "ideal_rainfall_max": 600.0,
        "ideal_ph_min": 6.5, "ideal_ph_max": 8.0,
        "growing_period_days": 75,
        "description": "Extremely drought-tolerant pulse thriving in arid sandy and light soils."
    },
    {
        "name": "Mung Bean",
        "category": "pulse",
        "ideal_temp_min": 25.0, "ideal_temp_max": 35.0,
        "ideal_rainfall_min": 400.0, "ideal_rainfall_max": 800.0,
        "ideal_ph_min": 6.2, "ideal_ph_max": 7.5,
        "growing_period_days": 70,
        "description": "Short-duration pulse (Green Gram) adaptable to multiple cropping rotations."
    },
    {
        "name": "Black Gram",
        "category": "pulse",
        "ideal_temp_min": 25.0, "ideal_temp_max": 35.0,
        "ideal_rainfall_min": 600.0, "ideal_rainfall_max": 1000.0,
        "ideal_ph_min": 6.5, "ideal_ph_max": 7.8,
        "growing_period_days": 85,
        "description": "Popular pulse (Urad) grown across Kharif and spring in black loamy soils."
    },
    {
        "name": "Lentil",
        "category": "pulse",
        "ideal_temp_min": 18.0, "ideal_temp_max": 28.0,
        "ideal_rainfall_min": 350.0, "ideal_rainfall_max": 650.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.5,
        "growing_period_days": 110,
        "description": "Cool-season legume widely consumed as Masoor dal."
    },
    {
        "name": "Pomegranate",
        "category": "fruit",
        "ideal_temp_min": 18.0, "ideal_temp_max": 38.0,
        "ideal_rainfall_min": 500.0, "ideal_rainfall_max": 900.0,
        "ideal_ph_min": 5.5, "ideal_ph_max": 7.5,
        "growing_period_days": 240,
        "description": "High-value horticultural crop with strong tolerance to dry climates and well-drained soils."
    },
    {
        "name": "Banana",
        "category": "fruit",
        "ideal_temp_min": 25.0, "ideal_temp_max": 35.0,
        "ideal_rainfall_min": 1200.0, "ideal_rainfall_max": 2200.0,
        "ideal_ph_min": 5.5, "ideal_ph_max": 7.0,
        "growing_period_days": 330,
        "description": "Year-round tropical fruit demanding rich organic soils and steady irrigation."
    },
    {
        "name": "Mango",
        "category": "fruit",
        "ideal_temp_min": 24.0, "ideal_temp_max": 36.0,
        "ideal_rainfall_min": 750.0, "ideal_rainfall_max": 1500.0,
        "ideal_ph_min": 5.5, "ideal_ph_max": 7.5,
        "growing_period_days": 150,
        "description": "Leading commercial perennial fruit crop of the tropics and subtropics."
    },
    {
        "name": "Grapes",
        "category": "fruit",
        "ideal_temp_min": 15.0, "ideal_temp_max": 35.0,
        "ideal_rainfall_min": 500.0, "ideal_rainfall_max": 900.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.5,
        "growing_period_days": 160,
        "description": "High-value temperate-subtropical crop requiring trained trellis pruning and precise drip irrigation."
    },
    {
        "name": "Watermelon",
        "category": "fruit",
        "ideal_temp_min": 24.0, "ideal_temp_max": 32.0,
        "ideal_rainfall_min": 400.0, "ideal_rainfall_max": 700.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.0,
        "growing_period_days": 90,
        "description": "Summer fruit (Zaid) requiring abundant sunshine, warm soils, and sandy-loam texture."
    },
    {
        "name": "Muskmelon",
        "category": "fruit",
        "ideal_temp_min": 26.0, "ideal_temp_max": 32.0,
        "ideal_rainfall_min": 400.0, "ideal_rainfall_max": 650.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.0,
        "growing_period_days": 85,
        "description": "Warm-season cucurbit flourishing in sandy loam with low atmospheric humidity at ripening."
    },
    {
        "name": "Apple",
        "category": "fruit",
        "ideal_temp_min": 10.0, "ideal_temp_max": 24.0,
        "ideal_rainfall_min": 800.0, "ideal_rainfall_max": 1250.0,
        "ideal_ph_min": 5.5, "ideal_ph_max": 6.8,
        "growing_period_days": 180,
        "description": "Temperate fruit demanding chill hours during winter dormancy and loamy hill soils."
    },
    {
        "name": "Orange",
        "category": "fruit",
        "ideal_temp_min": 15.0, "ideal_temp_max": 35.0,
        "ideal_rainfall_min": 900.0, "ideal_rainfall_max": 1400.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.5,
        "growing_period_days": 270,
        "description": "Citrus fruit requiring well-drained sub-soils and dry periods for blossom inducement."
    },
    {
        "name": "Papaya",
        "category": "fruit",
        "ideal_temp_min": 22.0, "ideal_temp_max": 36.0,
        "ideal_rainfall_min": 1000.0, "ideal_rainfall_max": 1800.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.0,
        "growing_period_days": 270,
        "description": "Fast-growing tropical fruit extremely sensitive to waterlogging and frost."
    },
    {
        "name": "Coconut",
        "category": "oilseed",
        "ideal_temp_min": 24.0, "ideal_temp_max": 32.0,
        "ideal_rainfall_min": 1300.0, "ideal_rainfall_max": 2500.0,
        "ideal_ph_min": 5.2, "ideal_ph_max": 8.0,
        "growing_period_days": 365,
        "description": "Perennial palm vital for coastal agro-economies requiring humid equatorial climate."
    },
    {
        "name": "Cotton",
        "category": "cash_crop",
        "ideal_temp_min": 21.0, "ideal_temp_max": 32.0,
        "ideal_rainfall_min": 600.0, "ideal_rainfall_max": 1100.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 8.0,
        "growing_period_days": 160,
        "description": "Leading industrial fiber crop thriving in deep black soils (Regur) of central India."
    },
    {
        "name": "Jute",
        "category": "cash_crop",
        "ideal_temp_min": 24.0, "ideal_temp_max": 35.0,
        "ideal_rainfall_min": 1200.0, "ideal_rainfall_max": 2000.0,
        "ideal_ph_min": 6.0, "ideal_ph_max": 7.5,
        "growing_period_days": 120,
        "description": "Golden fiber crop thriving in hot and humid alluvial flood plains."
    },
    {
        "name": "Coffee",
        "category": "cash_crop",
        "ideal_temp_min": 18.0, "ideal_temp_max": 28.0,
        "ideal_rainfall_min": 1400.0, "ideal_rainfall_max": 2400.0,
        "ideal_ph_min": 5.5, "ideal_ph_max": 6.5,
        "growing_period_days": 240,
        "description": "Highland plantation crop thriving under shade canopy in rich, permeable soils."
    }
]


class Command(BaseCommand):
    help = "Seeds master agricultural crops catalog into MongoDB."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Connecting to database..."))
        connected, msg = check_mongo_connection()
        if not connected:
            self.stderr.write(self.style.ERROR(f"Connection failed: {msg}"))
            return

        col = crops_col()
        inserted_count = 0
        updated_count = 0
        now = datetime.now(timezone.utc)

        for crop in STANDARD_CROPS:
            name = crop['name']
            existing = col.find_one({"name": name})
            if not existing:
                crop['created_at'] = now
                col.insert_one(crop)
                inserted_count += 1
            else:
                crop['updated_at'] = now
                col.update_one({"name": name}, {"$set": crop})
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"[OK] Master crops seeding complete! Inserted: {inserted_count}, Updated: {updated_count}. Total in catalog: {col.count_documents({})}"
        ))
