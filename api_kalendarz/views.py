from django.shortcuts import render
from .models import Event
from .serializers import EventSerializer
from rest_framework import viewsets
# Create your views here.

"""
Klasa EventViewSet dziedziczy po ModelViewSet, co oznacza, że automatycznie obsługuje wszystkie podstawowe operacje CRUD (Create, Read, Update, Delete) dla modelu Event.
- queryset: Określa, które obiekty modelu Event będą dostępne w tym widoku. W tym przypadku, używamy Event.objects.all(), co oznacza, że wszystkie wydarzenia będą dostępne.
- serializer_class: Określa, który serializer będzie używany do konwersji danych między formatem JSON a modelem Django. W tym przypadku, używamy EventSerializer, który zdefiniowaliśmy wcześniej.
Dzięki tej klasie, możemy łatwo zarządzać wydarzeniami w kalendarzu poprzez API, bez konieczności pisania dodatkowego kodu do obsługi poszczególnych operacji.
"""
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

