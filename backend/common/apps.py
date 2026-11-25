import os
import sys
from django.apps import AppConfig


class CommonConfig(AppConfig):
    name = 'common'

    def ready(self):
        """
        Auto-seed demo users, master crops, and procurement depots on `runserver` startup.
        Ensures seamless out-of-the-box demo experience without manual seeding steps.
        """
        if 'runserver' in sys.argv:
            try:
                from common.db import (
                    users_col,
                    farmer_profiles_col,
                    buyer_profiles_col,
                    crops_col,
                    procurement_centres_col,
                    procurement_slots_col,
                    init_mongo_indexes,
                )
                from common.authentication import hash_password
                from datetime import datetime, timezone, timedelta

                init_mongo_indexes()
                users = users_col()
                now = datetime.now(timezone.utc)

                # Seed Admin Demo Account
                if not users.find_one({"email": "admin@smartagri.org"}):
                    users.insert_one({
                        "username": "admin",
                        "email": "admin@smartagri.org",
                        "password_hash": hash_password("Admin@123"),
                        "role": "admin",
                        "first_name": "System",
                        "last_name": "Admin",
                        "phone": "+91-9876543210",
                        "is_active": True,
                        "created_at": now,
                        "updated_at": now,
                    })

                # Seed Farmer Demo Account (matches Login.jsx 1-click button)
                if not users.find_one({"username": "ramesh_farmer"}):
                    farmer_res = users.insert_one({
                        "username": "ramesh_farmer",
                        "email": "farmer@smartagri.org",
                        "password_hash": hash_password("Password@123"),
                        "role": "farmer",
                        "first_name": "Ramesh",
                        "last_name": "Kumar",
                        "phone": "+91-9812345678",
                        "is_active": True,
                        "created_at": now,
                        "updated_at": now,
                    })
                    farmer_profiles_col().insert_one({
                        "user_id": farmer_res.inserted_id,
                        "state": "Punjab",
                        "district": "Ludhiana",
                        "village": "Gill",
                        "pin_code": "141006",
                        "experience_years": 12,
                        "preferred_language": "Hindi",
                        "created_at": now,
                        "updated_at": now,
                    })

                # Seed Buyer Demo Account
                if not users.find_one({"username": "suresh_traders"}):
                    buyer_res = users.insert_one({
                        "username": "suresh_traders",
                        "email": "buyer@smartagri.org",
                        "password_hash": hash_password("Password@123"),
                        "role": "buyer",
                        "first_name": "Suresh",
                        "last_name": "Gupta",
                        "phone": "+91-9823456789",
                        "is_active": True,
                        "created_at": now,
                        "updated_at": now,
                    })
                    buyer_profiles_col().insert_one({
                        "user_id": buyer_res.inserted_id,
                        "business_name": "Kisan Agro Wholesalers Pvt Ltd",
                        "business_type": "wholesaler",
                        "gst_number": "07AAAAA0000A1Z5",
                        "address": "Shop 42, Grain Market, Karnal, Haryana",
                        "pin_code": "132001",
                        "preferred_commodities": ["Wheat", "Rice", "Maize"],
                        "created_at": now,
                        "updated_at": now,
                    })

                # Seed Crops if collection is empty
                crops = crops_col()
                if crops.count_documents({}) == 0:
                    from crops.management.commands.seed_crops import STANDARD_CROPS
                    for crop in STANDARD_CROPS:
                        doc = dict(crop)
                        doc["created_at"] = now
                        doc["updated_at"] = now
                        crops.insert_one(doc)

                # Seed Procurement Centres and initial delivery slots if empty
                centres = procurement_centres_col()
                if centres.count_documents({}) == 0:
                    from procurement.management.commands.seed_procurement import CENTRES
                    for centre in CENTRES:
                        c_doc = dict(centre)
                        c_doc["created_at"] = now
                        c_doc["updated_at"] = now
                        res = centres.insert_one(c_doc)
                        for day_offset in range(1, 4):
                            slot_date = (now + timedelta(days=day_offset)).strftime("%Y-%m-%d")
                            for start_t, end_t in [("09:00", "12:00"), ("13:00", "16:00")]:
                                procurement_slots_col().insert_one({
                                    "centre_id": res.inserted_id,
                                    "date": slot_date,
                                    "start_time": start_t,
                                    "end_time": end_t,
                                    "max_capacity_quintals": 1000.0,
                                    "booked_capacity_quintals": 0.0,
                                    "is_available": True,
                                    "created_at": now,
                                    "updated_at": now,
                                })
            except Exception:
                pass

