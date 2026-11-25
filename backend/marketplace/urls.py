"""
URL patterns for Marketplace: Mandi Prices and Farmer Produce Listings.
"""

from django.urls import path
from marketplace.views import (
    MarketPricesView,
    MarketCommoditiesView,
    MarketStatesView,
    ProductListingListCreateView,
    ProductListingDetailView,
    FarmerMyListingsView,
    ListingInquiryView,
)

app_name = 'marketplace'

urlpatterns = [
    # Mandi Benchmark Market Prices (Agmarknet)
    path('prices/', MarketPricesView.as_view(), name='market_prices'),
    path('commodities/', MarketCommoditiesView.as_view(), name='market_commodities'),
    path('states/', MarketStatesView.as_view(), name='market_states'),

    # Produce Listings
    path('listings/', ProductListingListCreateView.as_view(), name='listings_list_create'),
    path('listings/<str:listing_id>/', ProductListingDetailView.as_view(), name='listing_detail'),
    path('listings/<str:listing_id>/inquire/', ListingInquiryView.as_view(), name='listing_inquire'),
    path('my-listings/', FarmerMyListingsView.as_view(), name='my_listings'),
]
