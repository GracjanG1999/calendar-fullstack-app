from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """
    Serializator modelu Event — konwertuje obiekt Django ↔ JSON.

    fields = '__all__' — uwzględnia wszystkie pola modelu:
    id, title, start, end, all_day, is_recurring,
    recurring_days, r_start_time, r_end_time, color.
    """
    class Meta:
        model = Event
        fields = '__all__'