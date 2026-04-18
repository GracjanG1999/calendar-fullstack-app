// Komponent kafelka wydarzenia wyświetlanego bezpośrednio na siatce kalendarza
// (widok miesiąc, tydzień, dzień). Przekazywany do react-big-calendar przez
// prop `components.event`, co nadpisuje domyślny wygląd eventów biblioteki.

import React from 'react';
import moment from 'moment';

const EventComponent = ({ event }) => (
  <div className="event-tile-content">
    {/* Godziny pokazywane tylko dla wydarzeń z określonym czasem (nie całodniowych) */}
    {!event.all_day && (
      <span className="event-time-label">
        {moment(event.start).format('HH:mm')}-{moment(event.end).format('HH:mm')}
      </span>
    )}
    <span className="event-title-label">{event.title}</span>
  </div>
);

export default EventComponent;
