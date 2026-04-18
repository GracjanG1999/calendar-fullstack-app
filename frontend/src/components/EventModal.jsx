// Modal tworzenia, edycji i usuwania wydarzeń.
// Odpowiada za:
//   - wyświetlenie formularza z polami (tytuł, tryb, daty, godziny, dni, kolor)
//   - wysłanie żądania POST (nowe) lub PUT (edycja) do API
//   - wysłanie żądania DELETE po potwierdzeniu przez użytkownika
// Nie zarządza własnym stanem formularza — dane przychodzą przez prop `event`,
// a zmiany są zgłaszane do rodzica przez `onChange` (partial update).

import React from 'react';
import moment from 'moment';
import axios from 'axios';
import { EVENT_COLORS, DAY_LABELS, API_BASE_URL } from '../constants';
import { buildEventPayload } from '../utils/eventHelpers';

// Etykiety trybów wydarzenia wyświetlane na przyciskach wyboru trybu
const MODE_LABELS = {
  single: 'Jednorazowe',
  period: 'Okresowe (od-do)',
  weekly: 'Cykliczne',
};

// Props:
//   event    — pełny obiekt stanu formularza (z App.jsx)
//   onChange — callback do częściowej aktualizacji stanu (przyjmuje obiekt różnic)
//   onClose  — zamknięcie modala bez zapisu
//   onSaved  — callback wywoływany po udanym zapisie/usunięciu (odświeża listę eventów)
const EventModal = ({ event, onChange, onClose, onSaved }) => {

  // Zapis: POST dla nowych eventów, PUT dla edytowanych (rozróżnienie przez event.id)
  const handleSave = async () => {
    if (!event.title) return alert('Tytuł jest wymagany!');

    const url    = event.id ? `${API_BASE_URL}/api/events/${event.id}/` : `${API_BASE_URL}/api/events/`;
    const method = event.id ? 'put' : 'post';

    try {
      await axios[method](url, buildEventPayload(event));
      onSaved();
      onClose();
    } catch {
      alert('Błąd zapisu.');
    }
  };

  // Usuwanie z potwierdzeniem — wywołuje onSaved() by odświeżyć listę po usunięciu
  const handleDelete = async () => {
    if (!event.id) return;
    if (!window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/events/${event.id}/`);
      onSaved();
      onClose();
    } catch {
      alert('Błąd usuwania wydarzenia.');
    }
  };

  // Przełącza obecność dnia w tablicy selectedDays (toggle)
  const toggleDay = (dayVal) => {
    const days = event.selectedDays.includes(dayVal)
      ? event.selectedDays.filter(d => d !== dayVal)
      : [...event.selectedDays, dayVal];
    onChange({ selectedDays: days });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">ZAPLANUJ WYDARZENIE</h2>

        {/* Wybór trybu: jednorazowe / okresowe (od-do) / cykliczne */}
        <div className="type-selector">
          {Object.entries(MODE_LABELS).map(([mode, label]) => (
            <button
              key={mode}
              className={`type-btn ${event.mode === mode ? 'active-type' : ''}`}
              onClick={() => onChange({ mode })}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sekcja daty — dla trybu 'period' pokazuje dwa pickery, dla pozostałych etykietę */}
        <div className="time-picker-container">
          {event.mode === 'period' ? (
            <div className="period-dates">
              <div className="time-field">
                <label>Od dnia</label>
                <input
                  type="date"
                  className="glow-input"
                  value={moment(event.start).format('YYYY-MM-DD')}
                  onChange={e => onChange({ start: new Date(e.target.value) })}
                />
              </div>
              <div className="time-field">
                <label>Do dnia</label>
                <input
                  type="date"
                  className="glow-input"
                  value={moment(event.end).format('YYYY-MM-DD')}
                  onChange={e => onChange({ end: new Date(e.target.value) })}
                />
              </div>
            </div>
          ) : (
            <div className="info-date-display">
              Planujesz na: {moment(event.start).format('dddd, DD MMMM YYYY')}
            </div>
          )}
        </div>

        {/* Pole tytułu / szczegółów wydarzenia */}
        <div className="input-with-label">
          <label>Szczegóły:</label>
          <input
            className="glow-input"
            placeholder="Co robimy?"
            value={event.title}
            onChange={e => onChange({ title: e.target.value })}
            autoFocus
          />
        </div>

        {/* Godziny startu i końca — zostawienie puste = wydarzenie całodniowe */}
        <div className="time-picker-container">
          <div className="time-field">
            <label>Start</label>
            <input
              type="time"
              value={event.startTime}
              onChange={e => onChange({ startTime: e.target.value })}
            />
          </div>
          <div className="time-field">
            <label>Koniec</label>
            <input
              type="time"
              value={event.endTime}
              onChange={e => onChange({ endTime: e.target.value })}
            />
          </div>
        </div>

        {/* Siatka dni tygodnia — widoczna tylko w trybie 'weekly' */}
        {event.mode === 'weekly' && (
          <div className="days-grid">
            {DAY_LABELS.map((day, idx) => {
              // (idx+1)%7 → Pon=1, Wt=2, ..., Sob=6, Ndz=0 (zgodnie z moment.js)
              const dayVal = String((idx + 1) % 7);
              return (
                <button
                  key={day}
                  className={`day-btn ${event.selectedDays.includes(dayVal) ? 'active' : ''}`}
                  onClick={() => toggleDay(dayVal)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}

        {/* Picker koloru — aktywny kolor zaznaczony obramowaniem (klasa .selected) */}
        <div className="colors-grid">
          {EVENT_COLORS.map(c => (
            <div
              key={c.value}
              className={`color-swatch ${event.color === c.value ? 'selected' : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => onChange({ color: c.value })}
              title={c.name}
            />
          ))}
        </div>

        {/* Przyciski akcji — Usuń widoczny tylko przy edycji istniejącego eventu */}
        <div className="modal-buttons">
          <button onClick={onClose} className="btn-cancel">Anuluj</button>
          {event.id && (
            <button onClick={handleDelete} className="btn-delete">Usuń</button>
          )}
          <button onClick={handleSave} className="btn-save">Zapisz Plan</button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
