"""
Management command to seed realistic Procurement Centres and active delivery slots.
"""

from datetime import datetime, timezone, timedelta
from django.core.management.base import BaseCommand
from common.db import procurement_centres_col, procurement_slots_col


CENTRES = [
    {
        "name": "Karnal Central Food Grain Hub",
        "state": "Haryana",
        "district": "Karnal",
        "address": "GT Road, Near Anaj Mandi, Karnal, Haryana 132001",
        "latitude": 29.6857,
        "longitude": 76.9905,
        "contact_phone": "+91 184 225 4321",
        "capacity_quintals": 25000.0,
        "commodities_accepted": ["Wheat", "Rice", "Maize", "Mustard"],
        "operating_hours": "08:00 AM - 05:00 PM"
    },
    {
        "name": "Ludhiana District Mandi & Grain Silo",
        "state": "Punjab",
        "district": "Ludhiana",
        "address": "Ferozepur Road, Gill Village, Ludhiana, Punjab 141006",
        "latitude": 30.9010,
        "longitude": 75.8573,
        "contact_phone": "+91 161 240 1980",
        "capacity_quintals": 30000.0,
        "commodities_accepted": ["Wheat", "Rice", "Cotton", "Barley"],
        "operating_hours": "07:30 AM - 06:00 PM"
    },
    {
        "name": "Hapur State Warehousing Complex",
        "state": "Uttar Pradesh",
        "district": "Hapur",
        "address": "Delhi-Moradabad Highway, Hapur, Uttar Pradesh 245101",
        "latitude": 28.7306,
        "longitude": 77.7759,
        "contact_phone": "+91 122 230 4512",
        "capacity_quintals": 20000.0,
        "commodities_accepted": ["Wheat", "Sugarcane", "Rice", "Maize"],
        "operating_hours": "08:30 AM - 05:30 PM"
    },
    {
        "name": "Indore Malwa Cooperative Procurement Center",
        "state": "Madhya Pradesh",
        "district": "Indore",
        "address": "Nemawar Road, Transport Nagar, Indore, Madhya Pradesh 452001",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "contact_phone": "+91 731 280 3422",
        "capacity_quintals": 22000.0,
        "commodities_accepted": ["Soybean", "Wheat", "Gram", "Cotton"],
        "operating_hours": "08:00 AM - 05:00 PM"
    },
    {
        "name": "Nashik Agri-Produce Marketing Yard",
        "state": "Maharashtra",
        "district": "Nashik",
        "address": "Peth Road, Panchavati, Nashik, Maharashtra 422003",
        "latitude": 19.9975,
        "longitude": 73.7898,
        "contact_phone": "+91 253 251 2890",
        "capacity_quintals": 18000.0,
        "commodities_accepted": ["Onion", "Maize", "Soybean", "Pomegranate"],
        "operating_hours": "07:00 AM - 04:30 PM"
    },
    {
        "name": "Guntur Mirchi & Cotton Terminal",
        "state": "Andhra Pradesh",
        "district": "Guntur",
        "address": "Nallapadu Road, Guntur, Andhra Pradesh 522005",
        "latitude": 16.3067,
        "longitude": 80.4365,
        "contact_phone": "+91 863 223 1189",
        "capacity_quintals": 15000.0,
        "commodities_accepted": ["Chilli", "Cotton", "Rice", "Tobacco"],
        "operating_hours": "08:00 AM - 05:00 PM"
    },
    {
        "name": "Rajkot APMC Oilseed Complex",
        "state": "Gujarat",
        "district": "Rajkot",
        "address": "Marketing Yard, Bedi Road, Rajkot, Gujarat 360003",
        "latitude": 22.3039,
        "longitude": 70.8022,
        "contact_phone": "+91 281 245 6710",
        "capacity_quintals": 20000.0,
        "commodities_accepted": ["Groundnut", "Cotton", "Sesame", "Cumin"],
        "operating_hours": "08:00 AM - 05:00 PM"
    },
    {
        "name": "Jaipur Surajpole Krishi Upaj Mandi",
        "state": "Rajasthan",
        "district": "Jaipur",
        "address": "Surajpole Gate, Mandi Parisar, Jaipur, Rajasthan 302003",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "contact_phone": "+91 141 260 4911",
        "capacity_quintals": 16000.0,
        "commodities_accepted": ["Mustard", "Bajra", "Wheat", "Gram"],
        "operating_hours": "08:30 AM - 05:30 PM"
    }
]

SLOT_TIMES = [
    ("08:00 AM", "11:00 AM", 800.0),
    ("11:30 AM", "02:30 PM", 1000.0),
    ("03:00 PM", "06:00 PM", 700.0)
]


class Command(BaseCommand):
    help = "Seeds standard Government and Cooperative Procurement Centres with active delivery slots."

    def handle(self, *args, **options):
        self.stdout.write("Connecting to database and seeding procurement centres...")
        now = datetime.now(timezone.utc)
        today = datetime.now().date()

        centres_col = procurement_centres_col()
        slots_col = procurement_slots_col()

        inserted_centres = 0
        inserted_slots = 0

        for c in CENTRES:
            existing = centres_col.find_one({"name": c["name"]})
            if existing:
                centre_id = existing["_id"]
            else:
                doc = {
                    "name": c["name"],
                    "state": c["state"],
                    "district": c["district"],
                    "address": c["address"],
                    "location": {
                        "type": "Point",
                        "coordinates": [c["longitude"], c["latitude"]]
                    },
                    "contact_phone": c["contact_phone"],
                    "capacity_quintals": c["capacity_quintals"],
                    "commodities_accepted": c["commodities_accepted"],
                    "operating_hours": c["operating_hours"],
                    "status": "active",
                    "created_at": now
                }
                res = centres_col.insert_one(doc)
                centre_id = res.inserted_id
                inserted_centres += 1

            # Seed delivery slots for today and next 6 days
            for day_offset in range(7):
                slot_date = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
                for start_t, end_t, cap in SLOT_TIMES:
                    slot_exists = slots_col.find_one({
                        "centre_id": centre_id,
                        "slot_date": slot_date,
                        "start_time": start_t
                    })
                    if not slot_exists:
                        slot_doc = {
                            "centre_id": centre_id,
                            "centre_name": c["name"],
                            "slot_date": slot_date,
                            "start_time": start_t,
                            "end_time": end_t,
                            "capacity_quintals": cap,
                            "booked_quintals": 0.0,
                            "status": "available",
                            "created_at": now
                        }
                        slots_col.insert_one(slot_doc)
                        inserted_slots += 1

        self.stdout.write(self.style.SUCCESS(
            f"[OK] Procurement seeding complete! Centres: {inserted_centres} new, Slots: {inserted_slots} new. Total centres: {centres_col.count_documents({})}"
        ))
