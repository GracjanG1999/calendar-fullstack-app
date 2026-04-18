// Centralny plik stałych — wszystkie "magiczne" wartości aplikacji są tu,
// dzięki czemu zmiana np. koloru domyślnego lub URL-u API odbywa się w jednym miejscu.

// Adres bazowy backendu Django
export const API_BASE_URL = 'http://127.0.0.1:8000';

// Paleta kolorów dostępnych przy tworzeniu wydarzenia
export const EVENT_COLORS = [
  { name: 'Niebieski', value: '#3b82f6' },
  { name: 'Zielony',   value: '#10b981' },
  { name: 'Żółty',    value: '#f59e0b' },
  { name: 'Czerwony', value: '#ef4444' },
  { name: 'Fiolet',   value: '#8b5cf6' },
  { name: 'Brązowy',  value: '#78350f' },
  { name: 'Różowy',   value: '#ec4899' },
];

// Domyślny kolor nowego wydarzenia (pierwszy z palety)
export const DEFAULT_COLOR = EVENT_COLORS[0].value;

// Etykiety przycisków widoku kalendarza (klucz = wartość widoku react-big-calendar)
export const VIEW_LABELS = {
  month:  'Miesiąc',
  week:   'Tydzień',
  day:    'Dzień',
  agenda: 'Agenda',
};

// Skrócone nazwy dni tygodnia wyświetlane w siatce wyboru dni cyklicznych
// Kolejność: Pon–Ndz (idx+1)%7 mapuje na format moment.js gdzie 0=Niedziela
export const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
