"""
Authentication and User Profile Views for Smart Agriculture.
All operations query and update MongoDB directly using PyMongo.
"""

from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny

from common.db import (
    users_col,
    farmer_profiles_col,
    buyer_profiles_col,
    notifications_col,
)
from common.authentication import (
    hash_password,
    verify_password,
    generate_tokens_for_user,
    verify_refresh_token,
)
from common.permissions import IsAuthenticatedMongo, IsAdmin
from common.utils import api_response, serialize_doc
from accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    RefreshTokenSerializer,
    ProfileUpdateSerializer,
)


class RegisterView(APIView):
    """
    Registers a new Farmer or Buyer.
    Creates a user record and linked role profile in MongoDB, then issues JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Registration validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        now = datetime.now(timezone.utc)

        # 1. Insert into users collection
        user_doc = {
            "username": data['username'],
            "email": data['email'],
            "password_hash": hash_password(data['password']),
            "role": data['role'],
            "first_name": data.get('first_name', ''),
            "last_name": data.get('last_name', ''),
            "phone": data.get('phone', ''),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        user_result = users_col().insert_one(user_doc)
        user_id = user_result.inserted_id
        user_doc['_id'] = user_id

        # 2. Insert into role-specific profile collection
        role_profile = None
        if data['role'] == 'farmer':
            farmer_profile_doc = {
                "user_id": user_id,
                "state": data.get('state', ''),
                "district": data.get('district', ''),
                "village": data.get('village', ''),
                "pin_code": data.get('pin_code', ''),
                "experience_years": data.get('experience_years', 0),
                "preferred_language": data.get('preferred_language', 'English'),
                "created_at": now,
                "updated_at": now,
            }
            farmer_profiles_col().insert_one(farmer_profile_doc)
            role_profile = farmer_profile_doc
        elif data['role'] == 'buyer':
            buyer_profile_doc = {
                "user_id": user_id,
                "business_name": data.get('business_name', ''),
                "business_type": data.get('business_type', 'wholesaler'),
                "gst_or_license": data.get('gst_or_license', ''),
                "delivery_address": data.get('delivery_address', ''),
                "city": data.get('city', ''),
                "state": data.get('state', ''),
                "created_at": now,
                "updated_at": now,
            }
            buyer_profiles_col().insert_one(buyer_profile_doc)
            role_profile = buyer_profile_doc

        # 3. Create initial welcome notification
        notifications_col().insert_one({
            "user_id": user_id,
            "title": "Welcome to Smart Agriculture!",
            "message": f"Hello {data.get('first_name') or data['username']}, your account has been registered successfully as a {data['role']}.",
            "type": "system",
            "is_read": False,
            "created_at": now,
        })

        # 4. Generate JWT tokens
        token_data = generate_tokens_for_user(user_doc)
        token_data['role_profile'] = serialize_doc(role_profile)

        return api_response(
            success=True,
            message=f"{data['role'].capitalize()} registered successfully.",
            data=token_data,
            status_code=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """
    Authenticates a user via username or email and password.
    Returns JWT access and refresh tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid input data.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        identifier = serializer.validated_data['username_or_email'].lower().strip()
        password = serializer.validated_data['password']

        # Find user by email or username
        user_doc = users_col().find_one({
            "$or": [
                {"email": identifier},
                {"username": identifier}
            ]
        })

        if not user_doc or not verify_password(password, user_doc.get('password_hash', '')):
            return api_response(
                success=False,
                message="Invalid username/email or password.",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if not user_doc.get('is_active', True):
            return api_response(
                success=False,
                message="This account has been deactivated. Please contact an administrator.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        token_data = generate_tokens_for_user(user_doc)

        # Attach role profile
        role = user_doc.get('role', 'farmer')
        if role == 'farmer':
            token_data['role_profile'] = serialize_doc(farmer_profiles_col().find_one({"user_id": user_doc['_id']}))
        elif role == 'buyer':
            token_data['role_profile'] = serialize_doc(buyer_profiles_col().find_one({"user_id": user_doc['_id']}))

        return api_response(
            success=True,
            message="Login successful.",
            data=token_data,
            status_code=status.HTTP_200_OK
        )


class RefreshTokenView(APIView):
    """
    Issues a new access token using a valid refresh token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Refresh token is required.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        try:
            payload = verify_refresh_token(serializer.validated_data['refresh'])
            user_id = payload.get('user_id')
            user_doc = users_col().find_one({"_id": ObjectId(user_id)})

            if not user_doc or not user_doc.get('is_active', True):
                return api_response(
                    success=False,
                    message="User no longer active or exists.",
                    status_code=status.HTTP_401_UNAUTHORIZED
                )

            token_data = generate_tokens_for_user(user_doc)
            return api_response(
                success=True,
                message="Token refreshed successfully.",
                data={"access": token_data['access'], "expires_in": token_data['expires_in']},
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return api_response(
                success=False,
                message=str(e),
                status_code=status.HTTP_401_UNAUTHORIZED
            )


class UserProfileView(APIView):
    """
    Retrieves or updates the authenticated user's account details and role-specific profile.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        user_id = request.user.object_id
        user_doc = users_col().find_one({"_id": user_id})
        if not user_doc:
            return api_response(success=False, message="User not found.", status_code=status.HTTP_404_NOT_FOUND)

        role = user_doc.get('role', 'farmer')
        profile_data = None
        if role == 'farmer':
            profile_data = farmer_profiles_col().find_one({"user_id": user_id})
        elif role == 'buyer':
            profile_data = buyer_profiles_col().find_one({"user_id": user_id})

        user_clean = serialize_doc(user_doc)
        user_clean.pop('password_hash', None)

        return api_response(
            success=True,
            data={
                "user": user_clean,
                "role_profile": serialize_doc(profile_data),
            }
        )

    def put(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        user_id = request.user.object_id
        now = datetime.now(timezone.utc)

        # Update base user fields
        user_updates = {"updated_at": now}
        for field in ['first_name', 'last_name', 'phone']:
            if field in data and data[field] is not None:
                user_updates[field] = data[field]

        users_col().update_one({"_id": user_id}, {"$set": user_updates})

        # Update role-specific fields
        role = request.user.role
        if role == 'farmer':
            farmer_fields = ['state', 'district', 'village', 'pin_code', 'experience_years', 'preferred_language']
            farmer_updates = {"updated_at": now}
            for field in farmer_fields:
                if field in data and data[field] is not None:
                    farmer_updates[field] = data[field]
            farmer_profiles_col().update_one({"user_id": user_id}, {"$set": farmer_updates}, upsert=True)
        elif role == 'buyer':
            buyer_fields = ['business_name', 'business_type', 'gst_or_license', 'delivery_address', 'city', 'state']
            buyer_updates = {"updated_at": now}
            for field in buyer_fields:
                if field in data and data[field] is not None:
                    buyer_updates[field] = data[field]
            buyer_profiles_col().update_one({"user_id": user_id}, {"$set": buyer_updates}, upsert=True)

        return self.get(request)


class LogoutView(APIView):
    """
    Stateless JWT logout endpoint. Notifies client to clear tokens.
    """
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request):
        return api_response(
            success=True,
            message="Logged out successfully."
        )


class AdminUsersListView(APIView):
    """
    Admin-only endpoint to list all platform users with filtering and search.
    Supports ?role=farmer|buyer|admin and ?search=term.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        role_filter = request.query_params.get('role')
        search_query = request.query_params.get('search', '').strip()

        query = {}
        if role_filter in ['farmer', 'buyer', 'admin']:
            query['role'] = role_filter

        if search_query:
            query['$or'] = [
                {'username': {'$regex': search_query, '$options': 'i'}},
                {'email': {'$regex': search_query, '$options': 'i'}},
                {'first_name': {'$regex': search_query, '$options': 'i'}},
                {'last_name': {'$regex': search_query, '$options': 'i'}},
            ]

        users = list(users_col().find(query).sort('created_at', -1))
        enriched_users = []

        for user in users:
            uid = user['_id']
            clean_user = serialize_doc(user)
            clean_user.pop('password_hash', None)

            if user.get('role') == 'farmer':
                f_prof = farmer_profiles_col().find_one({'user_id': uid})
                clean_user['profile'] = serialize_doc(f_prof) if f_prof else None
            elif user.get('role') == 'buyer':
                b_prof = buyer_profiles_col().find_one({'user_id': uid})
                clean_user['profile'] = serialize_doc(b_prof) if b_prof else None
            else:
                clean_user['profile'] = None

            enriched_users.append(clean_user)

        return api_response(
            success=True,
            data=enriched_users
        )


class AdminUserStatusView(APIView):
    """
    Admin-only endpoint to activate or suspend a platform user account.
    """
    permission_classes = [IsAdmin]

    def put(self, request, user_id):
        try:
            oid = ObjectId(user_id)
        except Exception:
            return api_response(
                success=False,
                message="Invalid user ID format.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user = users_col().find_one({'_id': oid})
        if not user:
            return api_response(
                success=False,
                message="User not found.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if user.get('role') == 'admin':
            return api_response(
                success=False,
                message="Cannot modify system administrator status.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        is_active = request.data.get('is_active')
        if is_active is None or not isinstance(is_active, bool):
            return api_response(
                success=False,
                message="is_active boolean field is required.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        now = datetime.now(timezone.utc)
        users_col().update_one({'_id': oid}, {'$set': {'is_active': is_active, 'updated_at': now}})

        status_str = "activated" if is_active else "suspended"
        return api_response(
            success=True,
            message=f"User account successfully {status_str}.",
            data={'user_id': user_id, 'is_active': is_active}
        )
