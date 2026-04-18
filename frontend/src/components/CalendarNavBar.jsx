// Pasek nawigacji kalendarza — odpowiada wyłącznie za UI sterowania:
// - przyciski Dzisiaj / < / > do zmiany wyświetlanego okresu
// - etykieta aktualnej daty (format zależy od widoku)
// - przyciski przełączania widoku (miesiąc/tydzień/dzień/agenda)
// - przycisk zmiany motywu (ciemny/jasny)
// Cała logika zmiany stanu trafia do App.jsx przez callbacki (onNavigate, onViewChange itd.)

import React from 'react';
import moment from 'moment';
import { VIEW_LABELS } from '../constants';

// Mapowanie widoku na funkcję formatującą etykietę daty w nagłówku
const formatDateLabel = (view, date) => {
  const formatters = {
    month:  () => moment(date).format('MMMM YYYY'),
    week:   () => `${moment(date).startOf('week').format('DD.MM')} – ${moment(date).endOf('week').format('DD.MM.YYYY')}`,
    day:    () => moment(date).format('D MMMM YYYY'),
    agenda: () => moment(date).format('MMMM YYYY'),
  };
  return formatters[view]?.() ?? '';
};

// Props:
//   currentDate   — aktualnie wyświetlana data
//   view          — aktywny widok ('month' | 'week' | 'day' | 'agenda')
//   isDarkMode    — flaga motywu (używana do wyboru ikony ☀️/🌙)
//   onNavigate    — callback ustawiający nową datę
//   onViewChange  — callback zmieniający widok
//   onToggleTheme — callback przełączający motyw
const CalendarNavBar = ({ currentDate, view, isDarkMode, onNavigate, onViewChange, onToggleTheme }) => (
  <div className="nav-bar">
    <div className="nav-left">
      <button onClick={() => onNavigate(new Date())} className="glow-button">
        Dzisiaj
      </button>
      <button
        onClick={() => onNavigate(moment(currentDate).subtract(1, view).toDate())}
        className="glow-button"
        style={{ margin: '0 5px' }}
      >
        {'<'}
      </button>
      <button
        onClick={() => onNavigate(moment(currentDate).add(1, view).toDate())}
        className="glow-button"
      >
        {'>'}
      </button>
      <span className="current-month-label" style={{ marginLeft: '20px' }}>
        {formatDateLabel(view, currentDate)}
      </span>
    </div>

    <div className="nav-right">
      {/* Generujemy przyciski widoków z VIEW_LABELS — zmiana etykiety = zmiana w stałych */}
      {Object.entries(VIEW_LABELS).map(([v, label]) => (
        <button
          key={v}
          onClick={() => onViewChange(v)}
          className={`glow-button ${view === v ? 'active-view' : ''}`}
        >
          {label}
        </button>
      ))}
      <button onClick={onToggleTheme} className="glow-button theme-toggle">
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  </div>
);

export default CalendarNavBar;
