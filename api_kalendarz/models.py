from django.db import models


class Event(models.Model):
    """
    Model `Event` — reprezentuje pojedyncze wydarzenie lub wzorzec cykliczny.

    Pola:
    - title (CharField): nazwa wydarzenia.
    - start, end (DateTimeField): podstawowe daty/godziny dla wydarzeń jednorazowych
      lub punkt odniesienia dla cyklicznych wystąpień.
    - all_day (BooleanField): flaga oznaczająca całodniowe wydarzenie (bez godzin).
    - is_recurring (BooleanField): czy wydarzenie jest cykliczne.
    - recurring_days (CharField): lista dni tygodnia dla cykliczności w formacie
      CSV, np. "1,2,3" (gdzie 0 = niedziela, 1 = poniedziałek, ...).
    - r_start_time, r_end_time (TimeField): zapis godzin dla cyklicznych wystąpień
      (np. "10:00"). Mogą być puste gdy wydarzenie jest całodniowe.

    Uwaga:
    - Pole `recurring_days` przechowuje numery dni jako tekst, by uprościć zapisy
      cyklicznych reguł; parsowanie/serializacja odbywa się po stronie logiki aplikacji.
    - `__str__` zwraca tytuł wydarzenia, co ułatwia debugowanie i wyświetlanie w adminie.
    """
    title = models.CharField(max_length=255)

    # Podstawowe daty (dla jednorazowych i jako punkt odniesienia dla cykli)
    start = models.DateTimeField()
    end = models.DateTimeField()

    # Flagi sterujące logiką, o którą Pan prosił
    all_day = models.BooleanField(default=False)  # Jeśli godziny są puste
    is_recurring = models.BooleanField(default=False)  # Czy to cykl

    # Dni tygodnia zapisane jako string, np. "1,2,3"
    recurring_days = models.CharField(max_length=50, blank=True, null=True)

    # Zapamiętujemy same godziny dla cykli, np. "10:00"
    r_start_time = models.TimeField(blank=True, null=True)
    r_end_time = models.TimeField(blank=True, null=True)

    # Kolor dla wydarzenia (opcjonalnie, można dodać później)
    color = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.title
