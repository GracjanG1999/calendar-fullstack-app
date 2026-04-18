// Niestandardowy widok agendy zastępujący wbudowany widok react-big-calendar.
// Wyświetla wydarzenia pogrupowane po dniach w obrębie aktualnego miesiąca.
// Motyw (dark/light) jest obsługiwany przez CSS na poziomie klasy rodzica w App.jsx,
// więc komponent nie potrzebuje propsa isDarkMode.

import React from 'react';
import moment from 'moment';

// Pojedynczy wiersz wydarzenia — obsługuje dwa warianty:
// - całodniowe (all_day): tytuł + etykieta "Cały dzień"
// - godzinowe (timed): zakres godzin + tytuł
const AgendaEvent = ({ event }) => (
  <div
    className={`agenda-event ${event.all_day ? 'all-day' : 'timed'}`}
    style={{ borderLeftColor: event.color }} // kolor paska bocznego z ustawień eventu
  >
    {event.all_day ? (
      <>
        {event.title}
        <span className="all-day-label">Cały dzień</span>
      </>
    ) : (
      <>
        <span className="event-time">
          {moment(event.start).format('HH:mm')} – {moment(event.end).format('HH:mm')}
        </span>
        <span className="event-title">{event.title}</span>
      </>
    )}
  </div>
);

// Karta jednego dnia — nagłówek z datą oraz sekcje z całodniowymi i godzinowymi eventami.
// Całodniowe renderowane są przed godzinowymi dla lepszej czytelności.
const AgendaDayCard = ({ day, events }) => {
  const allDayEvents = events.filter(e => e.all_day);
  const timedEvents  = events.filter(e => !e.all_day);

  return (
    <div className="agenda-day-card">
      <h3 className="agenda-day-header">
        {moment(day).format('dddd, DD MMMM YYYY')}
      </h3>
      {allDayEvents.length > 0 && (
        <div className="agenda-section">
          {allDayEvents.map(e => <AgendaEvent key={e.id} event={e} />)}
        </div>
      )}
      {timedEvents.length > 0 && (
        <div className="agenda-section">
          {timedEvents.map(e => <AgendaEvent key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
};

// Główny komponent agendy:
// 1. Filtruje eventy do aktualnego miesiąca
// 2. Grupuje je po dniach (klucz YYYY-MM-DD)
// 3. Sortuje dni chronologicznie i renderuje karty
const CustomAgenda = ({ events, currentDate }) => {
  const filtered = events.filter(e =>
    moment(e.start).isSame(currentDate, 'month')
  );

  const grouped = filtered.reduce((acc, event) => {
    const day = moment(event.start).format('YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  return (
    <div className="agenda-wrapper">
      {sortedDays.length === 0 && (
        <div className="no-events">Brak wydarzeń w tym miesiącu</div>
      )}
      {sortedDays.map(day => (
        <AgendaDayCard
          key={day}
          day={day}
          events={grouped[day].sort((a, b) => new Date(a.start) - new Date(b.start))}
        />
      ))}
    </div>
  );
};

export default CustomAgenda;
