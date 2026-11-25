"""
Common utility functions for PyMongo documents, serialization, and responses.
"""

from bson import ObjectId
from datetime import datetime, date
from rest_framework.response import Response
from rest_framework import status


def serialize_doc(doc):
    """
    Recursively transforms BSON/MongoDB document fields into JSON-serializable types.
    - ObjectId -> str
    - datetime / date -> ISO 8601 string
    - Handles nested dicts and lists
    """
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, (datetime, date)):
        return doc.isoformat()
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result['id'] = str(value)
            else:
                result[key] = serialize_doc(value)
        return result
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    return doc


def parse_object_id(id_str):
    """
    Safely converts a string to BSON ObjectId.
    Returns (ObjectId, None) if valid, or (None, error_str) if invalid.
    """
    if not id_str:
        return None, "ID cannot be empty."
    try:
        return ObjectId(str(id_str)), None
    except Exception:
        return None, f"Invalid ObjectId format: '{id_str}'"


def api_response(success=True, data=None, message="", status_code=status.HTTP_200_OK, errors=None):
    """
    Standardized API response wrapper across all endpoints.
    """
    payload = {
        "success": success,
        "message": message,
        "data": serialize_doc(data) if data is not None else None,
    }
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)
