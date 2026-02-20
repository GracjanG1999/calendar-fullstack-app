from rest_framework import serializers
from .models import Event

"""
Selializer dla modelu Event, który będzie używany do konwersji danych między formatem JSON a modelem Django.
Używamy ModelSerializer, który automatycznie generuje pola na podstawie modelu Event. 
W tym przypadku, ustawiamy fields na '__all__', co oznacza, że wszystkie pola modelu będą uwzględnione w serializacji.
"""
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__' 