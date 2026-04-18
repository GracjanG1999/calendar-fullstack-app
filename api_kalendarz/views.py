from .models import Event
from .serializers import EventSerializer
from rest_framework import viewsets


class EventViewSet(viewsets.ModelViewSet):
    """
    REST API dla wydarzeń kalendarza.

    Dziedziczy po ModelViewSet, który automatycznie generuje endpointy:
      GET    /api/events/        → lista wszystkich wydarzeń
      POST   /api/events/        → utwórz nowe wydarzenie
      GET    /api/events/{id}/   → szczegóły jednego wydarzenia
      PUT    /api/events/{id}/   → zaktualizuj wydarzenie
      DELETE /api/events/{id}/   → usuń wydarzenie
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer

