"""
Root URL Configuration for Smart Agriculture Backend.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from common.db import check_mongo_connection


@api_view(['GET'])
@permission_classes([AllowAny])
def api_health(request):
    """System health check and database connectivity verification."""
    mongo_status, mongo_details = check_mongo_connection()
    return Response({
        "status": "healthy" if mongo_status else "degraded",
        "service": "Smart Agriculture AI Platform API",
        "version": "1.0.0",
        "database": {
            "type": "MongoDB Atlas",
            "connected": mongo_status,
            "details": mongo_details
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', api_health, name='api_health'),
    path('api/auth/', include('accounts.urls')),
    path('api/farms/', include('farms.urls')),
    path('api/crops/', include('crops.urls')),
    path('api/predictions/', include('predictions.urls')),
    path('api/disease/', include('predictions.disease_urls')),
    path('api/weather/', include('weather.urls')),
    path('api/market/', include('marketplace.urls')),
    path('api/orders/', include('marketplace.order_urls')),
    path('api/procurement/', include('procurement.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/', include('support.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
