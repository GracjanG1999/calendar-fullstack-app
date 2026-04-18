# Kalendarz — Full-Stack App

Aplikacja kalendarza oparta na **Django REST Framework** (backend) i **React + Vite** (frontend).

---

## Funkcje

- **Widoki:** Miesiąc, Tydzień, Dzień, Agenda
- **Tryb nocny / dzienny** — przełącznik w pasku nawigacji
  - Nocny: białe cyfry z efektem moonlight, niebieska poświata na "dzisiaj"
  - Dzienny: kremowo-żółte tło komórek, złota odznaka na "dzisiaj"
- **Tworzenie wydarzeń** — trzy tryby:
  - Jednorazowe
  - Okresowe (zakres dat od–do)
  - Cykliczne (wybrane dni tygodnia)
- **Kolory wydarzeń** — 7 kolorów do wyboru
- **Agenda** — własny scroll, dzisiaj zawsze na górze, przeszłość ładowana po 3 dni w górę
- **Responsywność** — działa na telefonie, tablecie i PC

---

## Stos technologiczny

| Warstwa   | Technologia                        | Wersja  |
|-----------|------------------------------------|---------|
| Backend   | Python / Django                    | 5.0.6   |
| Backend   | Django REST Framework              | 3.16.1  |
| Backend   | django-cors-headers                | 4.9.0   |
| Frontend  | React                              | 19.2.0  |
| Frontend  | Vite                               | 7.3.1   |
| Frontend  | react-big-calendar                 | 1.19.4  |
| Frontend  | moment.js (lokalizacja PL)         | 2.30.1  |
| Frontend  | axios                              | 1.13.5  |
| Baza      | SQLite (dev) / dowolna SQL (prod)  | —       |

---

## Struktura projektu

### Legenda ikon

| Ikona | Znaczenie |
|-------|-----------|
| 📁 | Folder |
| 🐍 | Plik Python (`.py`) |
| ⚛️ | Plik React / JSX (`.jsx`) |
| 🎨 | Arkusz stylów CSS |
| 📄 | Plik konfiguracyjny / JS |
| ⚙️ | Plik konfiguracji narzędzia |
| 🗄️ | Baza danych |
| 📝 | Dokumentacja Markdown |

```
📁 kalendarz_projekt/
│
├── 📁 api_kalendarz/               # Aplikacja Django — REST API
│   ├── 🐍 models.py                # Model Event (tytuł, daty, cykliczność, kolor)
│   ├── 🐍 serializers.py           # JSON ↔ Model (ModelSerializer)
│   ├── 🐍 views.py                 # CRUD — ModelViewSet
│   ├── 🐍 urls.py                  # Routing /api/events/
│   └── 🐍 admin.py                 # Panel admina Django
│
├── 📁 core/                        # Konfiguracja Django
│   ├── 🐍 settings.py              # Ustawienia projektu, CORS, baza danych
│   └── 🐍 urls.py                  # Główny routing URL
│
├── 📁 frontend/                    # Aplikacja React + Vite
│   ├── 📄 package.json             # Zależności Node.js
│   ├── ⚙️  vite.config.js           # Konfiguracja Vite
│   └── 📁 src/
│       ├── ⚛️  App.jsx              # Główny komponent — stan, logika, render
│       ├── ⚛️  main.jsx             # Punkt wejścia React (montowanie do DOM)
│       ├── 🎨 index.css            # Zmienne CSS (tryby dark/light) + responsive
│       │
│       ├── 📁 styles/              # Arkusze CSS podzielone per funkcja
│       │   ├── 🎨 calendar.css     # Nadpisania react-big-calendar
│       │   ├── 🎨 navigation.css   # Pasek nawigacji + responsive
│       │   ├── 🎨 agenda.css       # Widok Agenda
│       │   └── 🎨 modal.css        # Modal tworzenia/edycji wydarzeń
│       │
│       ├── 📁 components/          # Komponenty React (wydzielone)
│       │   ├── ⚛️  EventComponent.jsx      # Kafelek zdarzenia w siatce
│       │   ├── ⚛️  MonthCellWrapper.jsx    # Klikalna komórka widoku miesiąca
│       │   ├── ⚛️  CustomAgenda.jsx        # Alternatywny widok agendy
│       │   └── ⚛️  EventModal.jsx          # Modal formularza zdarzenia
│       │
│       ├── 📁 constants/           # Stałe aplikacji
│       │   └── 📄 index.js         # Kolory, URL API, etykiety widoków
│       │
│       ├── 📁 hooks/               # Custom React hooks
│       │   └── 📄 useEvents.js     # Hook do pobierania wydarzeń z API
│       │
│       └── 📁 utils/               # Funkcje pomocnicze
│           └── 📄 eventHelpers.js  # Budowanie payloadu, parsowanie dat
│
├── 📁 venv/                        # Środowisko wirtualne Python (nie w repo)
├── 🗄️  db.sqlite3                  # Baza danych SQLite (nie w repo)
├── 🐍 manage.py                    # CLI Django
├── 📄 .gitignore                   # Reguły ignorowania plików
└── 📝 README.md                    # Dokumentacja projektu
```

---

## Uruchomienie

### Wymagania
- Python 3.10+
- Node.js 18+

### Backend

```bash
# 1. Aktywuj środowisko wirtualne
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 2. Zainstaluj zależności (tylko przy pierwszym uruchomieniu)
pip install django djangorestframework django-cors-headers

# 3. Wykonaj migracje (tylko przy pierwszym uruchomieniu)
python manage.py migrate

# 4. Uruchom serwer
python manage.py runserver
# → http://127.0.0.1:8000
```

### Frontend

```bash
# W osobnym terminalu:
cd frontend

# Zainstaluj zależności (tylko przy pierwszym uruchomieniu)
npm install

# Uruchom serwer deweloperski
npm run dev
# → http://localhost:5173
```

Oba serwery muszą działać jednocześnie.

---

## API

| Metoda   | Endpoint              | Opis                        |
|----------|-----------------------|-----------------------------|
| GET      | `/api/events/`        | Lista wszystkich wydarzeń   |
| POST     | `/api/events/`        | Utwórz nowe wydarzenie      |
| GET      | `/api/events/{id}/`   | Szczegóły wydarzenia        |
| PUT      | `/api/events/{id}/`   | Zaktualizuj wydarzenie      |
| DELETE   | `/api/events/{id}/`   | Usuń wydarzenie             |

### Przykładowy obiekt Event (JSON)

```json
{
  "id": 1,
  "title": "Spotkanie",
  "start": "2026-04-18T10:00:00",
  "end": "2026-04-18T11:00:00",
  "all_day": false,
  "is_recurring": false,
  "recurring_days": "",
  "r_start_time": null,
  "r_end_time": null,
  "color": "#3b82f6"
}
```

---

## Build produkcyjny (frontend)

```bash
cd frontend
npm run build
# Pliki statyczne trafią do frontend/dist/
# Podepnij je pod Django staticfiles lub osobny serwer (nginx, Vercel itp.)
```

---

## Znane ograniczenia (dev)

- Baza SQLite — do developmentu. Na produkcję zalecane PostgreSQL.
- Brak autentykacji — API jest otwarte. Przed wdrożeniem dodać JWT/session auth.
- CORS skonfigurowany na `localhost` — zmienić w `core/settings.py` przed deployem.
