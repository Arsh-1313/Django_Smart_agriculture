"""
Admin Aggregated System Reports and CSV Data Exporting Views.
"""

import csv
import io
from datetime import datetime, timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import status

from common.db import (
    users_col,
    farms_col,
    crops_col,
    product_listings_col,
    orders_col,
    procurement_centres_col,
    bookings_col,
    crop_predictions_col,
    yield_predictions_col,
    fertilizer_predictions_col,
    disease_detections_col,
    complaints_col,
)
from common.permissions import IsAdmin
from common.utils import api_response


class AdminReportsSummaryView(APIView):
    """
    GET: Aggregated platform performance and usage statistics for administration dashboard.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        # 1. Users
        total_farmers = users_col().count_documents({"role": "farmer"})
        total_buyers = users_col().count_documents({"role": "buyer"})
        active_users = users_col().count_documents({"is_active": True})

        # 2. Farms & Acreage
        total_farms = farms_col().count_documents({})
        farms_list = list(farms_col().find({}, {"acreage": 1, "irrigation_type": 1}))
        total_acreage = sum(f.get("acreage", 0.0) for f in farms_list)

        # 3. Marketplace & Orders
        total_listings = product_listings_col().count_documents({})
        active_listings = product_listings_col().count_documents({"status": "active"})
        total_orders = orders_col().count_documents({})
        orders = list(orders_col().find({}, {"total_price": 1, "status": 1, "quantity_quintals": 1}))
        total_gmv = sum(o.get("total_price", 0.0) for o in orders if o.get("status") in ["confirmed", "shipped", "delivered"])
        total_traded_quintals = sum(o.get("quantity_quintals", 0.0) for o in orders if o.get("status") in ["confirmed", "shipped", "delivered"])

        # 4. Procurement
        total_centres = procurement_centres_col().count_documents({})
        total_bookings = bookings_col().count_documents({})

        # 5. ML Inferences
        crop_preds_count = crop_predictions_col().count_documents({})
        yield_preds_count = yield_predictions_col().count_documents({})
        fert_preds_count = fertilizer_predictions_col().count_documents({})
        total_disease_scans = disease_detections_col().count_documents({})

        # Disease breakdown
        disease_pipeline = [
            {"$group": {"_id": "$disease_name", "count": {"$sum": 1}}}
        ]
        disease_breakdown = list(disease_detections_col().aggregate(disease_pipeline))
        disease_stats = [{"disease": d["_id"] or "Unknown", "count": d["count"]} for d in disease_breakdown]

        # 6. Grievances
        total_complaints = complaints_col().count_documents({})
        open_complaints = complaints_col().count_documents({"status": "open"})
        resolved_complaints = complaints_col().count_documents({"status": "resolved"})

        return api_response(
            success=True,
            data={
                "users": {
                    "farmers": total_farmers,
                    "buyers": total_buyers,
                    "active": active_users,
                    "total": total_farmers + total_buyers,
                },
                "farms": {
                    "total_farms": total_farms,
                    "total_acreage": round(total_acreage, 2),
                },
                "marketplace": {
                    "total_listings": total_listings,
                    "active_listings": active_listings,
                    "total_orders": total_orders,
                    "total_traded_value_inr": round(total_gmv, 2),
                    "total_traded_quintals": round(total_traded_quintals, 2),
                },
                "procurement": {
                    "centres": total_centres,
                    "bookings": total_bookings,
                },
                "predictions": {
                    "crop_recommendations": crop_preds_count,
                    "yield_predictions": yield_preds_count,
                    "fertilizer_recommendations": fert_preds_count,
                    "disease_scans": total_disease_scans,
                    "disease_breakdown": disease_stats,
                },
                "support": {
                    "total_tickets": total_complaints,
                    "open_tickets": open_complaints,
                    "resolved_tickets": resolved_complaints,
                }
            }
        )


class AdminReportsExportView(APIView):
    """
    GET: Generate and stream CSV export files for platform data.
    Supports ?type=users | orders | listings | diseases | bookings
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        export_type = request.query_params.get('type', 'users').lower()
        now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="smartagri_{export_type}_{now_str}.csv"'

        writer = csv.writer(response)

        if export_type == 'users':
            writer.writerow(['ID', 'Username', 'Email', 'Role', 'First Name', 'Last Name', 'Phone', 'Active', 'Joined At'])
            for u in users_col().find().sort('created_at', -1):
                writer.writerow([
                    str(u.get('_id')),
                    u.get('username'),
                    u.get('email'),
                    u.get('role'),
                    u.get('first_name', ''),
                    u.get('last_name', ''),
                    u.get('phone', ''),
                    u.get('is_active', True),
                    u.get('created_at', ''),
                ])

        elif export_type == 'orders':
            writer.writerow(['Order #', 'Crop Name', 'Quantity (Qtl)', 'Price/Qtl (INR)', 'Total Price (INR)', 'Status', 'Ordered At'])
            for o in orders_col().find().sort('created_at', -1):
                writer.writerow([
                    o.get('order_number'),
                    o.get('crop_name'),
                    o.get('quantity_quintals'),
                    o.get('price_per_quintal'),
                    o.get('total_price'),
                    o.get('status'),
                    o.get('created_at', ''),
                ])

        elif export_type == 'listings':
            writer.writerow(['Listing ID', 'Crop Name', 'Category', 'Quantity Available', 'Price/Qtl (INR)', 'Harvest Date', 'Status'])
            for l in product_listings_col().find().sort('created_at', -1):
                writer.writerow([
                    str(l.get('_id')),
                    l.get('crop_name'),
                    l.get('category'),
                    l.get('available_quantity'),
                    l.get('price_per_quintal'),
                    l.get('harvest_date'),
                    l.get('status'),
                ])

        elif export_type == 'diseases':
            writer.writerow(['Scan ID', 'Disease Name', 'Crop / Plant', 'Confidence (%)', 'Is Healthy', 'Scanned At'])
            for d in disease_detections_col().find().sort('created_at', -1):
                writer.writerow([
                    str(d.get('_id')),
                    d.get('disease_name'),
                    d.get('crop_name'),
                    d.get('confidence'),
                    d.get('is_healthy'),
                    d.get('created_at', ''),
                ])

        elif export_type == 'bookings':
            writer.writerow(['Booking Code', 'Centre Name', 'Slot Date', 'Time Window', 'Quantity (Qtl)', 'Status', 'Booked At'])
            for b in bookings_col().find().sort('created_at', -1):
                writer.writerow([
                    b.get('booking_code'),
                    b.get('centre_name'),
                    b.get('slot_date'),
                    f"{b.get('start_time')} - {b.get('end_time')}",
                    b.get('quantity_quintals'),
                    b.get('status'),
                    b.get('created_at', ''),
                ])

        else:
            return api_response(
                success=False,
                message="Invalid export type. Supported: users, orders, listings, diseases, bookings.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return response
