"""
URL patterns for Support, Complaints & Admin Reports.
"""

from django.urls import path
from support.views import ComplaintListCreateView, ComplaintDetailResolveView
from support.reports_views import AdminReportsSummaryView, AdminReportsExportView

app_name = 'support'

urlpatterns = [
    # Support & Complaints
    path('support/complaints/', ComplaintListCreateView.as_view(), name='complaints_list_create'),
    path('support/complaints/<str:complaint_id>/', ComplaintDetailResolveView.as_view(), name='complaint_detail'),
    path('support/complaints/<str:complaint_id>/resolve/', ComplaintDetailResolveView.as_view(), name='complaint_resolve'),

    # Admin Reports & Analytics
    path('admin/reports/summary/', AdminReportsSummaryView.as_view(), name='reports_summary'),
    path('admin/reports/export/', AdminReportsExportView.as_view(), name='reports_export'),
]
