"""
Marketplace, Mandi Market Price, Produce Listings and Order Views.
"""

import uuid
from datetime import datetime, timezone
from bson import ObjectId
from rest_framework.views import APIView
from rest_framework import status

from common.db import (
    product_listings_col,
    orders_col,
    farmer_profiles_col,
    buyer_profiles_col,
    users_col,
)
from common.permissions import IsAuthenticatedMongo, IsFarmer, IsBuyer, IsAdmin
from common.utils import api_response, serialize_doc, parse_object_id
from marketplace.services import (
    get_market_prices,
    get_distinct_commodities,
    get_distinct_states,
)
from marketplace.serializers import (
    ProductListingSerializer,
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
)
from notifications.services import create_notification


# ----------------------------------------------------------------------
# Mandi Market Price Endpoints (Agmarknet / data.gov.in)
# ----------------------------------------------------------------------

class MarketPricesView(APIView):
    """
    GET: Mandi commodity prices from Agmarknet / data.gov.in official feeds.
    Supports filtering by commodity, state, APMC market name, or text search.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        commodity = request.query_params.get('commodity')
        state = request.query_params.get('state')
        market = request.query_params.get('market')
        query = request.query_params.get('q')

        records = get_market_prices(
            commodity=commodity,
            state=state,
            market=market,
            query=query
        )

        return api_response(
            success=True,
            data=records,
            message=f"Retrieved {len(records)} mandi market benchmark records."
        )


class MarketCommoditiesView(APIView):
    """GET: List all active commodities in mandi feeds."""
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        commodities = get_distinct_commodities()
        return api_response(success=True, data=commodities)


class MarketStatesView(APIView):
    """GET: List all states with active reporting mandis."""
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        states = get_distinct_states()
        return api_response(success=True, data=states)


# ----------------------------------------------------------------------
# Produce Listings Endpoints (Farmer listings for direct sale)
# ----------------------------------------------------------------------

class ProductListingListCreateView(APIView):
    """
    GET: Browse active produce listings with multi-filter query support.
    POST: Farmer creates a new produce listing.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsFarmer()]
        return [IsAuthenticatedMongo()]

    def get(self, request):
        query = {"status": "active"}

        crop = request.query_params.get('crop')
        state = request.query_params.get('state')
        grade = request.query_params.get('grade')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')

        if crop:
            query["crop_name"] = {"$regex": crop.strip(), "$options": "i"}
        if state:
            query["state"] = {"$regex": state.strip(), "$options": "i"}
        if grade:
            query["quality_grade"] = grade
        if min_price or max_price:
            price_filter = {}
            if min_price:
                price_filter["$gte"] = float(min_price)
            if max_price:
                price_filter["$lte"] = float(max_price)
            query["price_per_quintal"] = price_filter

        cursor = product_listings_col().find(query).sort("created_at", -1)
        listings = [serialize_doc(doc) for doc in cursor]

        return api_response(
            success=True,
            data=listings,
            message=f"Found {len(listings)} active produce listings."
        )

    def post(self, request):
        serializer = ProductListingSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid listing data.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        farmer = request.user
        now = datetime.now(timezone.utc)

        # Retrieve farmer contact / profile if available
        profile = farmer_profiles_col().find_one({"user_id": farmer.object_id})
        contact_phone = profile.get("phone", "") if profile else ""
        farmer_name = profile.get("full_name") or farmer.username

        farm_oid = None
        if data.get('farm_id'):
            f_oid, _ = parse_object_id(data['farm_id'])
            farm_oid = f_oid

        doc = {
            "farmer_id": farmer.object_id,
            "farmer_name": farmer_name,
            "farmer_contact": contact_phone,
            "crop_name": data['crop_name'].strip(),
            "variety": data.get('variety', 'Standard'),
            "quantity_quintals": data['quantity_quintals'],
            "available_quantity": data['quantity_quintals'],
            "price_per_quintal": data['price_per_quintal'],
            "quality_grade": data.get('quality_grade', 'Grade A'),
            "harvest_date": data.get('harvest_date', ''),
            "state": data['state'].strip(),
            "district": data['district'].strip(),
            "description": data.get('description', ''),
            "farm_id": farm_oid,
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }

        res = product_listings_col().insert_one(doc)
        doc['_id'] = res.inserted_id

        return api_response(
            success=True,
            message="Produce listing published successfully.",
            data=serialize_doc(doc),
            status_code=status.HTTP_201_CREATED
        )


class FarmerMyListingsView(APIView):
    """
    GET: Returns all listings created by the authenticated farmer.
    """
    permission_classes = [IsFarmer]

    def get(self, request):
        cursor = product_listings_col().find({"farmer_id": request.user.object_id}).sort("created_at", -1)
        listings = [serialize_doc(doc) for doc in cursor]
        return api_response(
            success=True,
            data=listings,
            message=f"Retrieved {len(listings)} of your produce listings."
        )


class ProductListingDetailView(APIView):
    """
    GET: Details of a produce listing.
    PUT: Update listing (Farmer who created it).
    DELETE: Cancel / delete listing (Farmer who created it).
    """
    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [IsFarmer()]
        return [IsAuthenticatedMongo()]

    def get(self, request, listing_id):
        l_oid, err = parse_object_id(listing_id)
        if err:
            return api_response(success=False, message="Invalid listing ID.", status_code=status.HTTP_400_BAD_REQUEST)

        listing = product_listings_col().find_one({"_id": l_oid})
        if not listing:
            return api_response(success=False, message="Listing not found.", status_code=status.HTTP_404_NOT_FOUND)

        return api_response(success=True, data=serialize_doc(listing))

    def put(self, request, listing_id):
        l_oid, err = parse_object_id(listing_id)
        if err:
            return api_response(success=False, message="Invalid listing ID.", status_code=status.HTTP_400_BAD_REQUEST)

        listing = product_listings_col().find_one({"_id": l_oid})
        if not listing:
            return api_response(success=False, message="Listing not found.", status_code=status.HTTP_404_NOT_FOUND)

        if listing["farmer_id"] != request.user.object_id and request.user.role != 'admin':
            return api_response(success=False, message="Permission denied. You can only update your own listings.", status_code=status.HTTP_403_FORBIDDEN)

        update_fields = {}
        for key in ['price_per_quintal', 'available_quantity', 'description', 'status', 'quality_grade']:
            if key in request.data:
                update_fields[key] = request.data[key]

        if update_fields:
            update_fields['updated_at'] = datetime.now(timezone.utc)
            product_listings_col().update_one({"_id": l_oid}, {"$set": update_fields})

        updated = product_listings_col().find_one({"_id": l_oid})
        return api_response(success=True, message="Listing updated.", data=serialize_doc(updated))

    def delete(self, request, listing_id):
        l_oid, err = parse_object_id(listing_id)
        if err:
            return api_response(success=False, message="Invalid listing ID.", status_code=status.HTTP_400_BAD_REQUEST)

        listing = product_listings_col().find_one({"_id": l_oid})
        if not listing:
            return api_response(success=False, message="Listing not found.", status_code=status.HTTP_404_NOT_FOUND)

        if listing["farmer_id"] != request.user.object_id and request.user.role != 'admin':
            return api_response(success=False, message="Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        product_listings_col().update_one(
            {"_id": l_oid},
            {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}}
        )
        return api_response(success=True, message="Listing withdrawn.")


# ----------------------------------------------------------------------
# Buyer Orders Endpoints (B2B Purchase Requests and Status Lifecycle)
# ----------------------------------------------------------------------

class OrderListCreateView(APIView):
    """
    GET: List orders relevant to the authenticated user.
      - Buyer: orders placed by this buyer.
      - Farmer: orders received for farmer's produce.
      - Admin: all orders across platform.
    POST: Buyer places a new purchase order against an active listing.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsBuyer()]
        return [IsAuthenticatedMongo()]

    def get(self, request):
        user = request.user
        query = {}
        if user.role == 'buyer':
            query["buyer_id"] = user.object_id
        elif user.role == 'farmer':
            query["farmer_id"] = user.object_id

        cursor = orders_col().find(query).sort("created_at", -1)
        orders = [serialize_doc(doc) for doc in cursor]

        return api_response(
            success=True,
            data=orders,
            message=f"Retrieved {len(orders)} order records."
        )

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Invalid order request.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        l_oid, err = parse_object_id(data['listing_id'])
        if err:
            return api_response(success=False, message="Invalid listing ID.", status_code=status.HTTP_400_BAD_REQUEST)

        listing = product_listings_col().find_one({"_id": l_oid})
        if not listing or listing.get("status") != 'active':
            return api_response(
                success=False,
                message="Produce listing is no longer active or available.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        ordered_qty = float(data['quantity_quintals'])
        available_qty = float(listing.get('available_quantity', 0))

        if ordered_qty > available_qty:
            return api_response(
                success=False,
                message=f"Requested quantity ({ordered_qty} Qtl) exceeds available stock ({available_qty} Qtl).",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        price_per_qtl = float(listing['price_per_quintal'])
        total_price = round(ordered_qty * price_per_qtl, 2)
        now = datetime.now(timezone.utc)
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        buyer = request.user
        buyer_profile = buyer_profiles_col().find_one({"user_id": buyer.object_id})
        buyer_name = buyer_profile.get("business_name") or buyer.username

        order_doc = {
            "order_number": order_number,
            "buyer_id": buyer.object_id,
            "buyer_name": buyer_name,
            "buyer_contact": data['contact_phone'],
            "farmer_id": listing['farmer_id'],
            "farmer_name": listing.get('farmer_name', 'Farmer'),
            "listing_id": l_oid,
            "crop_name": listing['crop_name'],
            "variety": listing.get('variety', 'Standard'),
            "quality_grade": listing.get('quality_grade', 'Grade A'),
            "quantity_quintals": ordered_qty,
            "price_per_quintal": price_per_qtl,
            "total_price": total_price,
            "delivery_address": data['delivery_address'].strip(),
            "notes": data.get('notes', ''),
            "status": "requested",
            "status_history": [
                {
                    "status": "requested",
                    "updated_at": now,
                    "remarks": "Order submitted by buyer."
                }
            ],
            "created_at": now,
            "updated_at": now,
        }

        # Deduct quantity from listing
        new_avail = available_qty - ordered_qty
        listing_status = "active" if new_avail > 0.05 else "sold_out"
        product_listings_col().update_one(
            {"_id": l_oid},
            {"$set": {"available_quantity": new_avail, "status": listing_status, "updated_at": now}}
        )

        res = orders_col().insert_one(order_doc)
        order_doc['_id'] = res.inserted_id

        # Dispatch real-time in-app notifications
        create_notification(
            user_id=listing['farmer_id'],
            title="New Purchase Request Received",
            message=f"{buyer_name} requested {ordered_qty} quintals of {listing['crop_name']} (Total: ₹{total_price:,.2f}).",
            notification_type="order",
            link="/farmer/marketplace"
        )
        create_notification(
            user_id=buyer.object_id,
            title=f"Order Placed #{order_number}",
            message=f"Purchase request for {ordered_qty} quintals of {listing['crop_name']} submitted successfully.",
            notification_type="order",
            link="/buyer/orders"
        )

        return api_response(
            success=True,
            message="Order submitted successfully.",
            data=serialize_doc(order_doc),
            status_code=status.HTTP_201_CREATED
        )


class OrderDetailView(APIView):
    """
    GET: Retrieves full detail of a specific order.
    """
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request, order_id):
        o_oid, err = parse_object_id(order_id)
        if err:
            return api_response(success=False, message="Invalid order ID.", status_code=status.HTTP_400_BAD_REQUEST)

        order = orders_col().find_one({"_id": o_oid})
        if not order:
            return api_response(success=False, message="Order not found.", status_code=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role != 'admin' and order['buyer_id'] != user.object_id and order['farmer_id'] != user.object_id:
            return api_response(success=False, message="Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        return api_response(success=True, data=serialize_doc(order))


class OrderStatusUpdateView(APIView):
    """
    PUT: Updates status of an order ('accepted', 'shipped', 'delivered', 'cancelled').
    Restores inventory if cancelled. Dispatches notifications to both parties.
    """
    permission_classes = [IsAuthenticatedMongo]

    def put(self, request, order_id):
        o_oid, err = parse_object_id(order_id)
        if err:
            return api_response(success=False, message="Invalid order ID.", status_code=status.HTTP_400_BAD_REQUEST)

        order = orders_col().find_one({"_id": o_oid})
        if not order:
            return api_response(success=False, message="Order not found.", status_code=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_farmer = order['farmer_id'] == user.object_id
        is_buyer = order['buyer_id'] == user.object_id
        is_admin = user.role == 'admin'

        if not (is_farmer or is_buyer or is_admin):
            return api_response(success=False, message="Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = OrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        remarks = serializer.validated_data.get('remarks', '')
        now = datetime.now(timezone.utc)

        # Permission rules for status transitions
        if is_buyer and not is_admin and new_status != 'cancelled':
            return api_response(success=False, message="Buyers can only cancel pending requests.", status_code=status.HTTP_403_FORBIDDEN)

        # If cancelled, restore quantity to listing
        if new_status == 'cancelled' and order['status'] != 'cancelled':
            product_listings_col().update_one(
                {"_id": order['listing_id']},
                {
                    "$inc": {"available_quantity": order['quantity_quintals']},
                    "$set": {"status": "active", "updated_at": now}
                }
            )

        status_entry = {
            "status": new_status,
            "updated_at": now,
            "remarks": remarks or f"Status changed to {new_status} by {user.username}."
        }

        orders_col().update_one(
            {"_id": o_oid},
            {
                "$set": {"status": new_status, "updated_at": now},
                "$push": {"status_history": status_entry}
            }
        )

        # Notify counterpart
        recipient_id = order['buyer_id'] if is_farmer else order['farmer_id']
        create_notification(
            user_id=recipient_id,
            title=f"Order #{order['order_number']} {new_status.title()}",
            message=f"Order for {order['quantity_quintals']} Qtl {order['crop_name']} marked as {new_status}. {remarks}",
            notification_type="order",
            link="/buyer/orders" if is_farmer else "/farmer/marketplace"
        )

        updated_order = orders_col().find_one({"_id": o_oid})
        return api_response(
            success=True,
            message=f"Order status updated to {new_status}.",
            data=serialize_doc(updated_order)
        )


class ListingInquiryView(APIView):
    """
    POST: Authenticated Buyers send an inquiry or message to the Farmer regarding a produce listing.
    Generates a notification for the farmer and returns the farmer's contact details.
    """
    permission_classes = [IsBuyer]

    def post(self, request, listing_id):
        l_oid, err = parse_object_id(listing_id)
        if err or not l_oid:
            return api_response(success=False, message="Invalid listing ID.", status_code=status.HTTP_400_BAD_REQUEST)

        listing = product_listings_col().find_one({"_id": l_oid})
        if not listing:
            return api_response(success=False, message="Listing not found.", status_code=status.HTTP_404_NOT_FOUND)

        message_text = request.data.get('message', '').strip()
        requested_qty = request.data.get('quantity_quintals')

        buyer_user = request.user
        buyer_profile = buyer_profiles_col().find_one({"user_id": buyer_user.object_id})
        buyer_name = buyer_profile.get('business_name', buyer_user.username) if buyer_profile else buyer_user.username

        farmer = users_col().find_one({"_id": listing['farmer_id']})
        farmer_profile = farmer_profiles_col().find_one({"user_id": listing['farmer_id']})

        # Send notification to Farmer
        qty_note = f" Requested: {requested_qty} Qtl." if requested_qty else ""
        create_notification(
            user_id=listing['farmer_id'],
            title=f"Direct Inquiry for {listing['crop_name']} from {buyer_name}",
            message=f"Buyer inquiry: '{message_text}'{qty_note} Contact: {buyer_user.phone or buyer_user.email}",
            notification_type="marketplace",
            link="/farmer/marketplace"
        )

        return api_response(
            success=True,
            message="Inquiry delivered to farmer. Direct contact information provided below.",
            data={
                "farmer_name": f"{farmer.get('first_name', '')} {farmer.get('last_name', '')}".strip() or farmer.get('username'),
                "phone": farmer.get('phone', 'Available on direct request'),
                "village": farmer_profile.get('village', '') if farmer_profile else '',
                "district": farmer_profile.get('district', '') if farmer_profile else '',
                "state": farmer_profile.get('state', '') if farmer_profile else '',
            }
        )

