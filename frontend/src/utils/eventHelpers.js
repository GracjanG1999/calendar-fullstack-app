// Funkcje pomocnicze do transformacji danych wydarzeń.
// Oddzielają logikę budowania obiektów stanu i payloadów API od komponentów UI,
// dzięki czemu ta sama logika może być użyta w wielu miejscach bez duplikacji.

import moment from 'moment';
import { DEFAULT_COLOR } from '../constants';

// Tworzy pusty stan formularza dla NOWEGO wydarzenia.
// Parametr `overrides` pozwala nadpisać dowolne pole (np. datę klikniętej komórki).
export const buildNewEventState = (date, overrides = {}) => ({
  id:           null,       // null = nowe wydarzenie (POST), liczba = edycja (PUT)
  title:        '',
  start:        new Date(date),
  end:          new Date(date),
  startTime:    '',         // pusty string = wydarzenie całodniowe
  endTime:      '',
  mode:         'single',   // 'single' | 'period' | 'weekly'
  selectedDays: [String(moment(date).day())], // dzień klikniętej daty jako domyślny
  color:        DEFAULT_COLOR,
  allDay:       true,
  ...overrides,
});

// Przekształca istniejący event z API na stan formularza edycji.
// Używane gdy użytkownik kliknie na istniejące wydarzenie w kalendarzu.
export const eventToFormState = (event) => ({
  id:           event.id,
  title:        event.title,
  start:        new Date(event.start),
  end:          new Date(event.end),
  startTime:    event.all_day ? '' : moment(event.start).format('HH:mm'),
  endTime:      event.all_day ? '' : moment(event.end).format('HH:mm'),
  mode:         event.is_recurring ? 'weekly' : 'single',
  selectedDays: event.recurring_days ? event.recurring_days.split(',') : [],
  color:        event.color || DEFAULT_COLOR,
  allDay:       event.all_day,
});

// Buduje obiekt payload do wysłania na API (POST lub PUT).
// Obsługuje trzy tryby: jednorazowe, okresowe (od–do) i cykliczne.
export const buildEventPayload = (event) => {
  const isAllDay = !event.startTime || !event.endTime;

  const s = new Date(event.start);
  // Dla trybu 'period' end pochodzi z pola end formularza, w pozostałych = start
  const e = new Date(event.mode === 'period' ? event.end : event.start);

  if (!isAllDay) {
    const [sh, sm] = event.startTime.split(':');
    const [eh, em] = event.endTime.split(':');
    s.setHours(Number(sh), Number(sm));
    e.setHours(Number(eh), Number(em));
  } else {
    // Całodniowe: ustawiamy pełny zakres doby
    s.setHours(0, 0, 0);
    e.setHours(23, 59, 59);
  }

  return {
    title:          event.title,
    start:          s.toISOString(),
    end:            e.toISOString(),
    all_day:        isAllDay,
    color:          event.color,
    is_recurring:   event.mode === 'weekly',
    recurring_days: event.selectedDays.join(','),
  };
};
