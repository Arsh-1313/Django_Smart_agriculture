"""
Custom JWT Authentication Backend backed by MongoDB Atlas (PyMongo).
Does not rely on Django ORM User model.
"""

import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework import authentication, exceptions
from django.contrib.auth.hashers import make_password, check_password
from bson import ObjectId
from common.db import users_col


class MongoUser:
    """
    Lightweight user proxy object representing an authenticated MongoDB user.
    Complies with Django REST Framework's request.user expectations.
    """
    def __init__(self, doc):
        self.doc = doc
        self.id = str(doc.get('_id'))
        self.object_id = doc.get('_id')
        self.username = doc.get('username')
        self.email = doc.get('email')
        self.role = doc.get('role', 'farmer')
        self.first_name = doc.get('first_name', '')
        self.last_name = doc.get('last_name', '')
        self.phone = doc.get('phone', '')
        self.is_active = doc.get('is_active', True)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_staff(self):
        return self.role == 'admin'

    @property
    def is_superuser(self):
        return self.role == 'admin'

    def get(self, key, default=None):
        return self.doc.get(key, default)

    def __getitem__(self, item):
        return self.doc[item]

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "is_active": self.is_active,
        }

    def __str__(self):
        return f"{self.username} ({self.role})"


class MongoJWTAuthentication(authentication.BaseAuthentication):
    """
    Authenticates requests carrying a Bearer JWT in the Authorization header.
    Validates token signature and retrieves user from MongoDB `users` collection.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Authentication token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid authentication token.')

        if payload.get('token_type') != 'access':
            raise exceptions.AuthenticationFailed('Invalid token type for authorization.')

        user_id_str = payload.get('user_id')
        if not user_id_str:
            raise exceptions.AuthenticationFailed('Invalid token payload: missing user_id.')

        try:
            user_doc = users_col().find_one({"_id": ObjectId(user_id_str)})
        except Exception:
            raise exceptions.AuthenticationFailed('User record could not be retrieved.')

        if not user_doc:
            raise exceptions.AuthenticationFailed('User not found.')

        if not user_doc.get('is_active', True):
            raise exceptions.AuthenticationFailed('This user account has been deactivated.')

        user = MongoUser(user_doc)
        return (user, token)


def hash_password(plain_password: str) -> str:
    """Hashes a password using PBKDF2 with SHA-256."""
    return make_password(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks a plain-text password against a hashed password."""
    return check_password(plain_password, hashed_password)


def generate_tokens_for_user(user_doc: dict) -> dict:
    """
    Generates access and refresh JWT tokens for a MongoDB user document.
    """
    now = datetime.now(timezone.utc)
    user_id = str(user_doc.get('_id'))
    role = user_doc.get('role', 'farmer')

    access_exp = now + timedelta(minutes=settings.JWT_ACCESS_EXPIRATION_MINUTES)
    access_payload = {
        'token_type': 'access',
        'user_id': user_id,
        'username': user_doc.get('username'),
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int(access_exp.timestamp()),
    }
    access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    refresh_exp = now + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    refresh_payload = {
        'token_type': 'refresh',
        'user_id': user_id,
        'iat': int(now.timestamp()),
        'exp': int(refresh_exp.timestamp()),
    }
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    return {
        'access': access_token,
        'refresh': refresh_token,
        'expires_in': settings.JWT_ACCESS_EXPIRATION_MINUTES * 60,
        'user': MongoUser(user_doc).to_dict()
    }


def verify_refresh_token(refresh_token: str) -> dict:
    """
    Decodes and validates a refresh token.
    """
    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get('token_type') != 'refresh':
            raise exceptions.AuthenticationFailed('Invalid token type.')
        return payload
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Refresh token has expired.')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Invalid refresh token.')
