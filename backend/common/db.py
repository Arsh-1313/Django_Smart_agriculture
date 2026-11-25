"""
MongoDB connection manager and collection references using PyMongo.
Connects to MongoDB Atlas or local MongoDB configured via environment variables.
Provides a graceful in-memory MongoMock fallback in development if no live cluster is reachable.
"""

import sys
import logging
from pymongo import MongoClient, ASCENDING, DESCENDING, GEOSPHERE
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from django.conf import settings

logger = logging.getLogger(__name__)

_client = None
_db = None
_is_mock = False


def get_mongo_client():
    """
    Returns a singleton MongoClient instance with connection pooling.
    If live MongoDB is unreachable in development (DEBUG=True) or during test runs,
    safely falls back to in-memory MongoMock so development and testing proceed seamlessly.
    """
    global _client, _is_mock
    if _client is None:
        uri = getattr(settings, 'MONGO_URI', 'mongodb://localhost:27017/')
        is_test_env = 'test' in sys.argv or getattr(settings, 'TESTING', False)
        use_mock = getattr(settings, 'USE_MOCK_MONGO', False) or uri.startswith('mongomock') or is_test_env

        if use_mock:
            try:
                import mongomock
                _client = mongomock.MongoClient()
                _is_mock = True
                logger.info("Using in-memory MongoMock client.")
                return _client
            except ImportError:
                pass

        try:
            client = MongoClient(
                uri,
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500,
                maxPoolSize=50,
                minPoolSize=5
            )
            client.admin.command('ping')
            _client = client
            _is_mock = False
            logger.info("Connected successfully to MongoDB.")
        except Exception as e:
            if getattr(settings, 'DEBUG', True) or is_test_env:
                try:
                    import mongomock
                    logger.warning(
                        f"Could not connect to MongoDB at '{uri}': {e}. "
                        "Falling back to in-memory MongoMock for development. "
                        "To connect to live MongoDB Atlas, update MONGO_URI in backend/.env."
                    )
                    _client = mongomock.MongoClient()
                    _is_mock = True
                except ImportError:
                    logger.error(f"Failed to create MongoDB client and mongomock is not installed: {e}")
                    raise e
            else:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise e
    return _client


def get_db():
    """
    Returns the Smart Agriculture MongoDB database handle.
    """
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[settings.MONGO_DB_NAME]
    return _db


def is_using_mock_db():
    """Returns True if the database is currently running on MongoMock."""
    get_mongo_client()
    return _is_mock


# ----------------------------------------------------------------------
# Collection Accessors for all 17 collections
# ----------------------------------------------------------------------

def get_collection(name: str):
    return get_db()[name]


def users_col():
    return get_collection('users')


def farmer_profiles_col():
    return get_collection('farmer_profiles')


def buyer_profiles_col():
    return get_collection('buyer_profiles')


def farms_col():
    return get_collection('farms')


def soil_details_col():
    return get_collection('soil_details')


def crops_col():
    return get_collection('crops')


def crop_history_col():
    return get_collection('crop_history')


def crop_predictions_col():
    return get_collection('crop_predictions')


def yield_predictions_col():
    return get_collection('yield_predictions')


def fertilizer_predictions_col():
    return get_collection('fertilizer_predictions')


def disease_detections_col():
    return get_collection('disease_detections')


def weather_records_col():
    return get_collection('weather_records')


def product_listings_col():
    return get_collection('product_listings')


def orders_col():
    return get_collection('orders')


def procurement_centres_col():
    return get_collection('procurement_centres')


def procurement_slots_col():
    return get_collection('procurement_slots')


def bookings_col():
    return get_collection('bookings')


def notifications_col():
    return get_collection('notifications')


def complaints_col():
    return get_collection('complaints')


# ----------------------------------------------------------------------
# Index Management & Verification
# ----------------------------------------------------------------------

def init_mongo_indexes():
    """
    Creates necessary indexes across all 17 collections for query optimization
    and uniqueness enforcement. Safe to run multiple times (idempotent).
    """
    try:
        db = get_db()
        logger.info("Initializing MongoDB indexes...")

        # 1. users
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.users.create_index([("username", ASCENDING)], unique=True)
        db.users.create_index([("role", ASCENDING)])

        # 2. farmer_profiles
        db.farmer_profiles.create_index([("user_id", ASCENDING)], unique=True)
        db.farmer_profiles.create_index([("state", ASCENDING), ("district", ASCENDING)])

        # 3. buyer_profiles
        db.buyer_profiles.create_index([("user_id", ASCENDING)], unique=True)

        # 4. farms
        db.farms.create_index([("farmer_id", ASCENDING)])
        try:
            db.farms.create_index([("location", GEOSPHERE)])
        except Exception as e:
            logger.warning(f"Could not create 2dsphere index on farms.location: {e}")

        # 5. soil_details
        db.soil_details.create_index([("farm_id", ASCENDING)])
        db.soil_details.create_index([("recorded_date", DESCENDING)])

        # 6. crops
        db.crops.create_index([("name", ASCENDING)], unique=True)
        db.crops.create_index([("category", ASCENDING)])

        # 7. crop_history
        db.crop_history.create_index([("farm_id", ASCENDING)])
        db.crop_history.create_index([("year", DESCENDING), ("season", ASCENDING)])

        # 8. crop_predictions
        db.crop_predictions.create_index([("farmer_id", ASCENDING)])
        db.crop_predictions.create_index([("predicted_at", DESCENDING)])

        # 9. yield_predictions
        db.yield_predictions.create_index([("farmer_id", ASCENDING)])
        db.yield_predictions.create_index([("predicted_at", DESCENDING)])

        # 10. disease_detections
        db.disease_detections.create_index([("farmer_id", ASCENDING)])
        db.disease_detections.create_index([("detected_at", DESCENDING)])

        # 11. weather_records
        db.weather_records.create_index([("farm_id", ASCENDING)])
        db.weather_records.create_index([("fetched_at", DESCENDING)])

        # 12. product_listings
        db.product_listings.create_index([("farmer_id", ASCENDING)])
        db.product_listings.create_index([("crop_name", ASCENDING)])
        db.product_listings.create_index([("status", ASCENDING)])
        db.product_listings.create_index([("created_at", DESCENDING)])

        # 13. orders
        db.orders.create_index([("buyer_id", ASCENDING)])
        db.orders.create_index([("farmer_id", ASCENDING)])
        db.orders.create_index([("listing_id", ASCENDING)])
        db.orders.create_index([("order_status", ASCENDING)])
        db.orders.create_index([("created_at", DESCENDING)])

        # 14. procurement_centres
        db.procurement_centres.create_index([("district", ASCENDING)])
        try:
            db.procurement_centres.create_index([("location", GEOSPHERE)])
        except Exception as e:
            logger.warning(f"Could not create 2dsphere index on procurement_centres: {e}")

        # 15. procurement_slots
        db.procurement_slots.create_index([("centre_id", ASCENDING), ("date", ASCENDING)])
        db.procurement_slots.create_index([("status", ASCENDING)])

        # 16. bookings
        db.bookings.create_index([("farmer_id", ASCENDING)])
        db.bookings.create_index([("slot_id", ASCENDING)])
        db.bookings.create_index([("booking_code", ASCENDING)], unique=True)
        db.bookings.create_index([("booked_at", DESCENDING)])

        # 17. notifications
        db.notifications.create_index([("user_id", ASCENDING), ("is_read", ASCENDING)])
        db.notifications.create_index([("created_at", DESCENDING)])

        # 18. complaints
        try:
            db.complaints.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            db.complaints.create_index([("status", ASCENDING)])
        except Exception:
            pass

        logger.info("MongoDB indexes successfully initialized across all 17 collections.")
        return True, "Indexes initialized successfully."
    except Exception as e:
        logger.error(f"Error initializing indexes: {e}")
        return False, str(e)


def check_mongo_connection():
    """
    Pings the MongoDB server to confirm connectivity.
    Returns (status: bool, message: str).
    """
    try:
        client = get_mongo_client()
        if _is_mock:
            return True, f"MongoMock active ({settings.MONGO_DB_NAME}). Set MONGO_URI in .env for Atlas."
        client.admin.command('ping')
        return True, f"Connected to {settings.MONGO_DB_NAME} (Live MongoDB)"
    except (ServerSelectionTimeoutError, ConnectionFailure) as e:
        return False, f"Connection timeout: {str(e)}"
    except Exception as e:
        return False, f"Connection error: {str(e)}"
