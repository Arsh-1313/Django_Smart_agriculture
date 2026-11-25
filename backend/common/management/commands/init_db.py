"""
Management command to initialize MongoDB Atlas collections, enforce indexes,
and seed a default system administrator account.
Usage: python manage.py init_db
"""

from datetime import datetime, timezone
from django.core.management.base import BaseCommand
from common.db import (
    init_mongo_indexes,
    users_col,
    check_mongo_connection,
    is_using_mock_db,
)
from common.authentication import hash_password


class Command(BaseCommand):
    help = "Initializes MongoDB indexes on all 17 collections and creates initial seed data."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Testing MongoDB connection..."))
        connected, msg = check_mongo_connection()
        if not connected:
            self.stderr.write(self.style.ERROR(f"Database connection failed: {msg}"))
            return

        mode_desc = "In-Memory MongoMock" if is_using_mock_db() else "Live MongoDB Server/Atlas"
        self.stdout.write(self.style.SUCCESS(f"Connected to database ({mode_desc}): {msg}"))

        self.stdout.write(self.style.NOTICE("Creating and verifying indexes across all 17 collections..."))
        success, idx_msg = init_mongo_indexes()
        if success:
            self.stdout.write(self.style.SUCCESS(f"[OK] {idx_msg}"))
        else:
            self.stderr.write(self.style.WARNING(f"[WARNING] Index initialization notice: {idx_msg}"))

        # Seed initial administrator account if not present
        col = users_col()
        admin_user = col.find_one({"email": "admin@smartagri.org"})
        if not admin_user:
            self.stdout.write(self.style.NOTICE("Seeding default Administrator user..."))
            now = datetime.now(timezone.utc)
            admin_doc = {
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
            }
            col.insert_one(admin_doc)
            self.stdout.write(self.style.SUCCESS(
                "[OK] Default administrator created:\n"
                "     Email:    admin@smartagri.org\n"
                "     Password: Admin@123\n"
                "     Role:     admin"
            ))
        else:
            self.stdout.write(self.style.SUCCESS("[OK] Administrator account already exists."))
