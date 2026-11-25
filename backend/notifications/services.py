"""
Notification Service for in-app alerts and activity tracking.
Handles creation and status updates for notifications across user roles.
"""

from datetime import datetime, timezone
from bson import ObjectId
from common.db import notifications_col
from common.utils import serialize_doc, parse_object_id


def create_notification(user_id, title: str, message: str, notification_type: str = 'system', link: str = '') -> dict:
    """
    Creates and stores an in-app notification for a given user.
    """
    u_oid, err = parse_object_id(user_id)
    if err:
        raise ValueError(f"Invalid user_id: {err}")

    doc = {
        "user_id": u_oid,
        "title": title.strip(),
        "message": message.strip(),
        "type": notification_type,
        "is_read": False,
        "link": link,
        "created_at": datetime.now(timezone.utc)
    }

    result = notifications_col().insert_one(doc)
    doc['_id'] = result.inserted_id
    return serialize_doc(doc)


def get_user_notifications(user_id, limit: int = 50, unread_only: bool = False):
    """
    Retrieves notifications for a specific user, sorted newest first.
    """
    u_oid, err = parse_object_id(user_id)
    if err:
        return [], 0

    query = {"user_id": u_oid}
    if unread_only:
        query["is_read"] = False

    cursor = notifications_col().find(query).sort("created_at", -1).limit(limit)
    items = [serialize_doc(doc) for doc in cursor]
    unread_count = notifications_col().count_documents({"user_id": u_oid, "is_read": False})

    return items, unread_count


def mark_notification_as_read(notification_id, user_id) -> bool:
    """
    Marks a single notification as read.
    """
    n_oid, err1 = parse_object_id(notification_id)
    u_oid, err2 = parse_object_id(user_id)
    if err1 or err2:
        return False

    res = notifications_col().update_one(
        {"_id": n_oid, "user_id": u_oid},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return res.modified_count > 0


def mark_all_notifications_as_read(user_id) -> int:
    """
    Marks all notifications for a user as read.
    """
    u_oid, err = parse_object_id(user_id)
    if err:
        return 0

    res = notifications_col().update_many(
        {"user_id": u_oid, "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return res.modified_count
