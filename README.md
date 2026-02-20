**Dokumentacja Techniczna: System Kalendarza Full-Stack**
Zintegrowany system do zarządzania danymi czasowymi oparty na architekturze klient-serwer.

1. **Architektura Rozwiązań**
System opiera się na separacji logiki biznesowej (Backend) od warstwy prezentacji (Frontend).

**Backend (Django Framework)**
    - Aplikacja API (api_kalendarz): Realizuje operacje CRUD na zasobach wydarzeń.
    - Model Danych: Persystencja danych realizowana przez model Event z mapowaniem na bazę SQLite.
    - Serializacja: Wykorzystanie klasy ModelSerializer z mapowaniem wszystkich pól (__all__) w celu automatyzacji konwersji obiektów Python na format JSON.
    - Core: Centralny moduł konfiguracyjny zarządzający routingiem URL oraz ustawieniami CORS (Cross-Origin Resource Sharing).

**Frontend (React.js)**
    - Środowisko wykonawcze: Wykorzystanie Vite jako build-tool i serwera deweloperskiego.
    - Zarządzanie Stanem: Komponent App.jsx inicjuje asynchroniczne żądania HTTP (Axios) do API.
    - Prezentacja: Wykorzystanie biblioteki react-big-calendar z nadpisanymi arkuszami stylów CSS.

2. **Specyfikacja Warstwy Wizualnej (CSS)**
Warstwa UI została zaimplementowana w pliku index.css z naciskiem na modyfikację domyślnych klas kalendarza:
    - Zmienne Root: Definicja schematu kolorów color-scheme: dark oraz palety dla trybu nocnego (tło: #1a1a1a, tekst: #ffffff).
    - Glow UI: Implementacja pseudo-klas :focus oraz :hover z wykorzystaniem box-shadow dla osiągnięcia efektu luminescencji elementów interaktywnych.
    - Layout Fixes: Wymuszenie responsywności siatki kalendarza poprzez display: flex !important dla klas .rbc-month-view oraz .rbc-month-row, co eliminuje błędy renderowania wysokości wierszy.

3. **Deployment i Uruchomienie**
**Procedura Backendowa**
Wymagany Python 3.x (preferowany 3.11) oraz aktywne izolowane środowisko wirtualne.

**Aktywacja środowiska:**
    - Windows: ```.\venv\Scripts\activate```
    - Unix: source venv/bin/activate

**Instalacja i inicjalizacja:**
    - ```pip install django djangorestframework django-cors-headers```
    - ```python manage.py migrate```

**Uruchomienie:**
    - ```python manage.py runserver```

**Procedura Frontendowa**
Wymagane środowisko Node.js.

**Instalacja:**
    - ```cd frontend``` 
    - ```npm install```

**Uruchomienie:**
    - ```npm run dev```

4. **Charakterystyka Projektu**
    - Model Danych (DRF): Minimalizacja boilerplate'u poprzez automatyczną serializację pól modelu.
    - Synchronizacja: Architektura bezstanowa po stronie klienta – dane pobierane są przy każdej instancji montowania komponentu (Single Source of Truth).
    - Parsowanie Czasu: Implementacja Moment.js w celu standaryzacji formatów ISO przesyłanych między frontendem a backendem.