"""
URL patterns for Government and Cooperative Procurement Centres, Slots, and Farmer Bookings.
"""

from django.urls import path
from procurement.views import (
    ProcurementCentreListCreateView,
    ProcurementCentreDetailView,
    ProcurementSlotListCreateView,
    BookingListCreateView,
    BookingStatusUpdateView,
)

app_name = 'procurement'

urlpatterns = [
    # Centres
    path('centres/', ProcurementCentreListCreateView.as_view(), name='centres_list_create'),
    path('centres/<str:centre_id>/', ProcurementCentreDetailView.as_view(), name='centre_detail'),
    path('centres/<str:centre_id>/slots/', ProcurementSlotListCreateView.as_view(), name='centre_slots'),

    # Bookings
    path('bookings/', BookingListCreateView.as_view(), name='bookings_list_create'),
    path('bookings/<str:booking_id>/status/', BookingStatusUpdateView.as_view(), name='booking_status_update'),
]
