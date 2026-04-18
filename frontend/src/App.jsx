import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/dist/locale/pl';
import axios from 'axios';

// Bazowy styl biblioteki react-big-calendar (siatka, nagłówki, sloty)
import 'react-big-calendar/lib/css/react-big-calendar.css';
// Globalne zmienne CSS (--bg-dark, --text-main, itd.) + układ strony
import './index.css';
// Nadpisania wyglądu kalendarza: kolory komórek, cyfry, "dzisiaj", hover
import './styles/calendar.css';
// Pasek nawigacji: przyciski, label miesiąca, przełącznik motywu
import './styles/navigation.css';
// Widok Agenda: karty dni, zdarzenia całodniowe i godzinowe
import './styles/agenda.css';
// Modal: formularz tworzenia/edycji wydarzeń, picker kolorów, przyciski
import './styles/modal.css';

// Ustawiamy język polski dla dat (nazwy dni, miesiące)
moment.locale('pl');
// localizer łączy moment.js z react-big-calendar (parsowanie dat)
const localizer = momentLocalizer(moment);

// Paleta kolorów dostępna przy tworzeniu wydarzeń
const EVENT_COLORS = [
  { name: 'Niebieski', value: '#3b82f6' },
  { name: 'Zielony', value: '#10b981' },
  { name: 'Żółty', value: '#f59e0b' },
  { name: 'Czerwony', value: '#ef4444' },
  { name: 'Fiolet', value: '#8b5cf6' },
  { name: 'Brązowy', value: '#78350f' },
  { name: 'Różowy', value: '#ec4899' },
];

// Adres backendu Django — zmieniaj tu przy wdrożeniu produkcyjnym
const API_BASE_URL = 'http://127.0.0.1:8000';

// Tłumaczenia nazw widoków kalendarza (ang. → pol.)
const viewLabels = {
  month: 'Miesiąc',
  week: 'Tydzień',
  day: 'Dzień',
  agenda: 'Agenda',
};

// Kafelek zdarzenia renderowany wewnątrz siatki kalendarza
// Pokazuje godzinę (jeśli nie jest całodniowe) + tytuł
const EventComponent = ({ event }) => (
  <div
    className="event-tile-content"
    style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}
  >
    {!event.all_day && (
      <span className="event-time-label">
        {moment(event.start).format('HH:mm')}-{moment(event.end).format('HH:mm')}
      </span>
    )}
    <span className="event-title-label">{event.title}</span>
  </div>
);

// Widok Agenda — własny scroll, przeszłość ładowana w górę po 3 dni.
const CustomAgenda = ({ events, isDarkMode = false }) => {
  // 0 = na starcie nie pokazujemy przeszłości — dzisiaj jest od razu na górze
  // bez żadnego liczenia pikseli. Przeszłość ładuje się po scrollu w górę.
  const [pastLimit, setPastLimit] = useState(0);
  const wrapperRef = useRef(null);
  const prevScrollHeightRef = useRef(null);
  const grouped = events.reduce((acc, event) => {
    const day = moment(event.start).format('YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
  const today = moment().format('YYYY-MM-DD');

  const allPastDays      = sortedDays.filter(d => d < today);
  const presentFutureDays = sortedDays.filter(d => d >= today);
  // slice(-0) === slice(0) w JS = cała tablica, dlatego osobny warunek
  const visiblePastDays  = pastLimit === 0 ? [] : allPastDays.slice(-pastLimit);
  const visibleDays      = [...visiblePastDays, ...presentFutureDays];
  const hasMorePast      = allPastDays.length > pastLimit;


  // Po załadowaniu starszych dni kompensujemy przesunięcie scrolla
  // żeby widok nie przeskakiwał (nowe karty wchodzą od góry)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper && prevScrollHeightRef.current !== null) {
      wrapper.scrollTop = wrapper.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    }
  }, [pastLimit]);

  // Ładuje kolejne 3 stare dni i kompensuje scroll żeby widok nie przeskoczył
  const loadMorePast = useCallback(() => {
    if (!hasMorePast) return;
    prevScrollHeightRef.current = wrapperRef.current?.scrollHeight ?? null;
    setPastLimit(prev => prev + 3);
  }, [hasMorePast]);

  // Auto-load gdy użytkownik scrolluje do górnej krawędzi (działa po pierwszym
  // załadowaniu gdy jest już co scrollować)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const handleScroll = () => {
      if (wrapper.scrollTop < 40 && hasMorePast) {
        loadMorePast();
      }
    };
    wrapper.addEventListener('scroll', handleScroll);
    return () => wrapper.removeEventListener('scroll', handleScroll);
  }, [hasMorePast, loadMorePast]);

  return (
    <div
      ref={wrapperRef}
      className={`agenda-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
      style={{
        overflowY: 'auto',
        height: 'var(--agenda-height)',
        position: 'relative',
      }}
    >
      {hasMorePast && (
        <button className="agenda-more-past" onClick={loadMorePast}>
          ↑ Pokaż starsze wydarzenia
        </button>
      )}

      {visibleDays.length === 0 && (
        <div className="no-events">Brak wydarzeń</div>
      )}

      {visibleDays.map(day => {
        const dayEvents    = grouped[day].sort((a, b) => new Date(a.start) - new Date(b.start));
        const allDayEvents = dayEvents.filter(e => e.all_day);
        const timedEvents  = dayEvents.filter(e => !e.all_day);

        return (
          <div key={day}>
            <div className="agenda-day-card">
              {/* Nagłówek: duża cyfra + nazwa dnia + miesiąc */}
              <div className="agenda-day-header">
                <span className="agenda-date-num">{moment(day).format('D')}</span>
                <div className="agenda-date-info">
                  <span className="agenda-date-name">{moment(day).format('dddd')}</span>
                  <span className="agenda-date-month">{moment(day).format('MMMM YYYY')}</span>
                </div>
              </div>

              {allDayEvents.map(e => (
                <div key={e.id} className="agenda-event all-day" style={{ borderLeftColor: e.color }}>
                  <span className="event-time">Cały dzień</span>
                  <span className="event-title">{e.title}</span>
                </div>
              ))}

              {timedEvents.map(e => (
                <div key={e.id} className="agenda-event" style={{ borderLeftColor: e.color }}>
                  <span className="event-time">
                    {moment(e.start).format('HH:mm')} – {moment(e.end).format('HH:mm')}
                  </span>
                  <span className="event-title">{e.title}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Wrapper na całą komórkę dnia w widoku miesiąca — kliknięcie otwiera modal
const MonthDateCellWrapper = ({ children, value, onOpen }) => {
  return (
    <div
      className="month-cell-click-area"
      onClick={() => onOpen?.(value)}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </div>
  );
};

// Nagłówek z numerem dnia — kliknięcie ustawia datę i otwiera modal dodawania
// Dodaje klasę "date-today" gdy data to dzisiaj (CSS nie może tego zrobić
// bo .rbc-today i .rbc-button-link są rodzeństwem w DOM, nie rodzicem i dzieckiem)
const MonthDateHeader = ({ date, label, onOpen }) => {
  const isToday = moment(date).isSame(moment(), 'day');
  return (
    <span
      className={`month-date-header-click${isToday ? ' date-today' : ''}`}
      onClick={() => onOpen?.(date)}
      title="Dodaj wydarzenie"
    >
      {label}
    </span>
  );
};

function App() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Zostawiamy stan tylko po to, by uniknąć błędu runtime po `setShowSummary(true)`.
  // Nie ma UI podsumowania (to jest już obecne w projekcie).
  const [, setShowSummary] = useState(false);

  const [newEvent, setNewEvent] = useState({
    id: null,
    title: '',
    start: new Date(),
    end: new Date(),
    startTime: "",
    endTime: "",
    mode: 'single',
    selectedDays: [],
    color: EVENT_COLORS[0].value,
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FETCH EVENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchEvents = () => {
    axios
      .get(`${API_BASE_URL}/api/events/`)
      .then(res => {
        const processed = res.data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          all_day: !!event.all_day,
        }));
        setEvents(processed);
      })
      .catch(err => console.error("Błąd API:", err));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openModalFromMonthClick = useCallback((date) => {
    const selectedDate = new Date(date);

    setNewEvent(prev => ({
      ...prev,
      id: null,
      title: '',
      start: selectedDate,
      end: selectedDate,
      // W miesiącu: brak domyślnych godzin => całodniowe
      startTime: "",
      endTime: "",
      allDay: true,
      mode: 'single',
      selectedDays: [String(moment(selectedDate).day())],
      color: EVENT_COLORS[0].value,
    }));

    setIsModalOpen(true);
  }, []);

  // Obiekt komponentów przekazywany do <Calendar> — zastępuje domyślne renderery
  // useMemo zapobiega przebudowie kalendarza przy każdym rerenderze App
  const calendarComponents = useMemo(() => ({
    event: EventComponent,
    // dateCellWrapper musi być tu (nie w month.dateCellWrapper) — tak działa rbc
    dateCellWrapper: (props) => {
      if (view !== 'month') return <div style={{ height: '100%' }}>{props.children}</div>;
      return <MonthDateCellWrapper {...props} onOpen={openModalFromMonthClick} />;
    },
    month: {
      dateHeader: (props) => (
        <MonthDateHeader {...props} onOpen={openModalFromMonthClick} />
      ),
    },
  }), [openModalFromMonthClick, view]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLE SAVE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Zapis wydarzenia: POST (nowe) lub PUT (edycja istniejącego)
  // Obsługuje tryby: jednorazowy, okresowy (od-do) i cykliczny (dni tygodnia)
  const handleSave = async () => {
    if (!newEvent.title) return alert("Tytuł jest wymagany!");

    const createData = (startDate, endDate) => {
      const isAllDay = !newEvent.startTime || !newEvent.endTime;
      let s = new Date(startDate);
      let e = new Date(endDate || startDate);

      if (!isAllDay) {
        const [sh, sm] = newEvent.startTime.split(':');
        const [eh, em] = newEvent.endTime.split(':');
        s.setHours(sh, sm);
        e.setHours(eh, em);
      } else {
        s.setHours(0, 0, 0);
        e.setHours(23, 59, 59);
      }
      
      return {
        title: newEvent.title,
        start: s.toISOString(),
        end: e.toISOString(),
        all_day: isAllDay,
        color: newEvent.color,
        is_recurring: newEvent.mode === 'weekly',
        recurring_days: newEvent.selectedDays.join(','),
      };
    };

    try {
      const url = newEvent.id
        ? `${API_BASE_URL}/api/events/${newEvent.id}/`
        : `${API_BASE_URL}/api/events/`;
      const data = createData(newEvent.start, newEvent.mode === 'period' ? newEvent.end : newEvent.start);
      await axios[newEvent.id ? 'put' : 'post'](url, data);
      fetchEvents();
      setIsModalOpen(false);
    } catch {
      alert("Błąd zapisu.");
    }
  };
 
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLE DELETE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const handleDelete = async () => {
        if (!newEvent.id) return; // nic nie rób, jeśli nie ma ID

        if (!window.confirm("Czy na pewno chcesz usunąć to wydarzenie?")) return;

        try {
        await axios.delete(`${API_BASE_URL}/api/events/${newEvent.id}/`);
          fetchEvents(); // odśwież listę wydarzeń
          setIsModalOpen(false);
        } catch {
          alert("Błąd usuwania wydarzenia.");
        }
      };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <div className="app-wrapper">
        <div className="main-container">
          <h1 className="main-title">KALENDARZ</h1>

          {/* NAVIGATION */}
          <div className="nav-bar">
            <div className="nav-left">
              {view !== 'agenda' && (
                <>
                  <button onClick={() => setCurrentDate(new Date())} className="glow-button">Dzisiaj</button>
                  <button onClick={() => setCurrentDate(moment(currentDate).subtract(1, view).toDate())} className="glow-button" style={{ margin: '0 5px' }}>{'<'}</button>
                  <button onClick={() => setCurrentDate(moment(currentDate).add(1, view).toDate())} className="glow-button">{'>'}</button>
                </>
              )}
              <span className="current-month-label" style={{ marginLeft: '20px' }}>
                {view === 'month' && moment(currentDate).format('MMMM YYYY')}
                {view === 'week' && `${moment(currentDate).startOf('week').format('DD.MM')} - ${moment(currentDate).endOf('week').format('DD.MM.YYYY')}`}
                {view === 'day' && moment(currentDate).format('D MMMM YYYY')}
                {view === 'agenda' && 'Wszystkie wydarzenia'}
              </span>
            </div>
            <div className="nav-right">
              {['month', 'week', 'day', 'agenda'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`glow-button ${view === v ? 'active-view' : ''}`}
                >
                  {viewLabels[v]}
            </button>
              ))}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="glow-button theme-toggle">
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          
            {view === 'agenda' ? (
              <CustomAgenda events={events} isDarkMode={isDarkMode} />
            ) : (
              <>
                <Calendar
                  localizer={localizer}
                  events={events.map(event => ({ ...event, allDay: event.all_day }))}
                  style={{ height: 'var(--calendar-height)' }}
                  toolbar={false}
                  date={currentDate}
                  view={view}
                  onNavigate={setCurrentDate}
                  onView={setView}
                  selectable
                  onSelectSlot={({ start, end }) => {
                    const selectedDate = new Date(start);
                    const isMonthView = view === 'month';

                    setNewEvent({
                      ...newEvent,
                      id: null,
                      title: '',
                      start: selectedDate,
                      end: end,
                      startTime: isMonthView ? "" : moment(start).format("HH:mm"),
                      endTime: isMonthView ? "" : moment(end).format("HH:mm"),
                      allDay: isMonthView,
                      mode: 'single',
                      selectedDays: [String(moment(selectedDate).day())],
                        color: EVENT_COLORS[0].value,
                    });

                    setIsModalOpen(true);
                  }}
                  onSelectEvent={(event) => {
                    const startTime = !event.all_day ? moment(event.start).format("HH:mm") : "";
                    const endTime = !event.all_day ? moment(event.end).format("HH:mm") : "";

                    setNewEvent({
                      id: event.id,
                      title: event.title,
                      start: new Date(event.start),
                      end: new Date(event.end),
                      startTime,
                      endTime,
                      mode: event.is_recurring ? 'weekly' : 'single',
                      selectedDays: event.recurring_days ? event.recurring_days.split(',') : [],
                      color: event.color || EVENT_COLORS[0].value,
                      allDay: event.all_day,
                    });

                    setIsModalOpen(true);
                  }}
                  components={calendarComponents}
                  eventPropGetter={(event) => {
                    const isPast = new Date(event.end) < new Date();
                    return {
                      style: {
                        backgroundColor: event.color || EVENT_COLORS[0].value,
                        opacity: isPast ? 0.4 : 1,
                        filter: isPast ? 'grayscale(50%)' : 'none',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#ffffff',
                        display: 'block',
                      }
                    };
                  }}
                />
              </>
            )}
          {/* MODAL */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">

                <h2 className="modal-title">ZAPLANUJ WYDARZENIE</h2>

                {/* TRYB WYDARZENIA */}
                <div className="type-selector">
                  {['single','period','weekly'].map(mode => (
                    <button
                      key={mode}
                      className={`type-btn ${newEvent.mode === mode ? 'active-type' : ''}`}
                      onClick={() => setNewEvent({...newEvent, mode})}
                    >
                      {mode==='single' && 'Jednorazowe'}
                      {mode==='period' && 'Okresowe (od-do)'}
                      {mode==='weekly' && 'Cykliczne'}
                    </button>
                  ))}
                </div>

                {/* DATA */}
                <div className="time-picker-container">
                  {newEvent.mode==='period' ? (
                    <div className="period-dates">
                      <div className="time-field">
                        <label>Od dnia</label>
                        <input type="date" className="glow-input" value={moment(newEvent.start).format('YYYY-MM-DD')}
                          onChange={e=>setNewEvent({...newEvent,start:new Date(e.target.value)})}/>
                      </div>
                      <div className="time-field">
                        <label>Do dnia</label>
                        <input type="date" className="glow-input" value={moment(newEvent.end).format('YYYY-MM-DD')}
                          onChange={e=>setNewEvent({...newEvent,end:new Date(e.target.value)})}/>
                      </div>
                    </div>
                  ):(
                    <div className="info-date-display">
                      Planujesz na: {moment(newEvent.start).format('dddd, DD MMMM YYYY')}
                    </div>
                  )}
                </div>

                {/* SZCZEGÓŁY */}
                <div className="input-with-label">
                  <label>Szczegóły:</label>
                  <input className="glow-input" placeholder="Co robimy?" value={newEvent.title}
                    onChange={e=>setNewEvent({...newEvent,title:e.target.value})} autoFocus/>
                </div>

                {/* CZAS START/KONIEC */}
                <div className="time-picker-container">
                  <div className="time-field">
                    <label>Start</label>
                    <input type="time" value={newEvent.startTime} onChange={e=>setNewEvent({...newEvent,startTime:e.target.value})}/>
                  </div>
                  <div className="time-field">
                    <label>Koniec</label>
                    <input type="time" value={newEvent.endTime} onChange={e=>setNewEvent({...newEvent,endTime:e.target.value})}/>
                  </div>
                </div>

                {/* DNI CYKLICZNE */}
                {newEvent.mode==='weekly' && (
                  <div className="days-grid">
                    {['Pon','Wt','Śr','Czw','Pt','Sob','Ndz'].map((day,idx)=>{
                      const dayVal=String((idx+1)%7);
                      return (
                        <button key={day} className={`day-btn ${newEvent.selectedDays.includes(dayVal)?'active':''}`}
                          onClick={()=>{
                            const days=newEvent.selectedDays.includes(dayVal)?newEvent.selectedDays.filter(d=>d!==dayVal):[...newEvent.selectedDays,dayVal];
                            setNewEvent({...newEvent,selectedDays:days});
                          }}>{day}</button>
                      );
                    })}
                  </div>
                )}

                {/* WYBÓR KOLORU */}
                <div className="colors-grid">
                  {EVENT_COLORS.map(c=>(
                    <div key={c.value} onClick={()=>setNewEvent({...newEvent,color:c.value})}
                      style={{
                        backgroundColor:c.value,
                        width:'32px', height:'32px',
                        borderRadius:'50%',
                        cursor:'pointer',
                        marginRight:'8px',
                        marginBottom:'8px',
                        border:newEvent.color===c.value?'3px solid white':'2px solid #ccc'
                      }}/>
                  ))}
                </div>

                {/* PRZYCISKI */}
                <div className="modal-buttons">
                  <button onClick={()=>setIsModalOpen(false)} className="btn-cancel">Anuluj</button>
                    {newEvent.id && (
                      <button onClick={handleDelete} className="btn-delete">Usuń</button>
                    )}
                  <button onClick={()=>{
                    handleSave();
                    setShowSummary(true); // pokazanie podsumowania
                  }} className="btn-save">Zapisz Plan</button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
  </div>

  );

}



export default App;