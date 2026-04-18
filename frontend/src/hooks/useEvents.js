// Hook odpowiedzialny wyłącznie za komunikację z API w zakresie eventów.
// Izoluje logikę pobierania danych od warstwy widoku — komponenty nie wiedzą
// skąd pochodzą dane, tylko że są dostępne przez { events, fetchEvents }.

import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

// Konwertuje surową odpowiedź API na obiekty gotowe do użycia w kalendarzu:
// - start/end jako Date (react-big-calendar wymaga obiektów Date, nie stringów)
// - all_day jako boolean (!! usuwa ewentualne null/undefined)
const parseEvent = (event) => ({
  ...event,
  start:   new Date(event.start),
  end:     new Date(event.end),
  all_day: !!event.all_day,
});

export const useEvents = () => {
  const [events, setEvents] = useState([]);

  // useCallback zapobiega tworzeniu nowej referencji funkcji przy każdym renderze,
  // co pozwala bezpiecznie używać fetchEvents jako zależności w useEffect w App.jsx
  const fetchEvents = useCallback(() => {
    axios
      .get(`${API_BASE_URL}/api/events/`)
      .then(res => setEvents(res.data.map(parseEvent)))
      .catch(err => console.error('Błąd API:', err));
  }, []);

  return { events, fetchEvents };
};
