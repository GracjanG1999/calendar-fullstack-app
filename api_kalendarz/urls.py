from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet

# Tworzymy router, który automatycznie obsłuży adresy URL dla kalendarza
router = DefaultRouter()
router.register(r'events', EventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]