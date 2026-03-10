import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/dist/locale/pl';
import axios from 'axios';

// Style
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './index.css';

moment.locale('pl');
const localizer = momentLocalizer(moment);

function App() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const EVENT_COLORS = [
    { name: 'Niebieski', value: '#3b82f6' },
    { name: 'Zielony', value: '#10b981' },
    { name: 'Żółty', value: '#f59e0b' },
    { name: 'Czerwony', value: '#ef4444' },
    { name: 'Fiolet', value: '#8b5cf6' },
    { name: 'Brązowy', value: '#78350f' },
    { name: 'Różowy', value: '#ec4899' },
  ];
    const viewLabels = {
    month: 'Miesiąc',
    week: 'Tydzień',
    day: 'Dzień',
    agenda: 'Agenda'
  };

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
      .get('http://127.0.0.1:8000/api/events/')
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLE SAVE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
      if (newEvent.mode === 'multi') {
        const startOfWeek = moment(newEvent.start).startOf('week');
        const promises = newEvent.selectedDays.map(dayOffset => {
          const targetDate = moment(startOfWeek).add(dayOffset, 'days').toDate();
          return axios.post('http://127.0.0.1:8000/api/events/', createData(targetDate));
        });
        await Promise.all(promises);
      } else {
        const url = newEvent.id
          ? `http://127.0.0.1:8000/api/events/${newEvent.id}/`
          : 'http://127.0.0.1:8000/api/events/';
        const data = createData(newEvent.start, newEvent.mode === 'period' ? newEvent.end : newEvent.start);
        await axios[newEvent.id ? 'put' : 'post'](url, data);
      }
      fetchEvents();
      setIsModalOpen(false);
    } catch (err) {
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
          await axios.delete(`http://127.0.0.1:8000/api/events/${newEvent.id}/`);
          fetchEvents(); // odśwież listę wydarzeń
          setIsModalOpen(false);
        } catch (err) {
          alert("Błąd usuwania wydarzenia.");
        }
      };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPONENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const EventComponent = ({ event }) => (
    <div className="event-tile-content" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
      {!event.all_day && (
        <span className="event-time-label">
          {moment(event.start).format('HH:mm')}-{moment(event.end).format('HH:mm')}
        </span>
      )}
      <span className="event-title-label">{event.title}</span>
    </div>
  );

 const CustomAgenda = ({ events, currentDate, isDarkMode }) => {
  // Grupujemy wydarzenia tylko z aktualnego miesiąca
  const filteredEvents = events.filter(e =>
    moment(e.start).isSame(currentDate, 'month')
  );

  // Grupowanie po dniach
  const grouped = filteredEvents.reduce((acc, event) => {
    const day = moment(event.start).format("YYYY-MM-DD");
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className={`agenda-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {sortedDays.length === 0 && (
        <div className="no-events">Brak wydarzeń w tym miesiącu</div>
      )}
      {sortedDays.map(day => {
        const dayEvents = grouped[day].sort((a, b) => new Date(a.start) - new Date(b.start));
        const allDayEvents = dayEvents.filter(e => e.all_day);
        const timedEvents = dayEvents.filter(e => !e.all_day);

        return (
          <div key={day} className={`agenda-day-card ${isDarkMode ? 'dark-mode-card' : 'light-mode-card'}`}>
            <h3 className={`agenda-day-header ${isDarkMode ? 'dark-mode-text' : 'light-mode-text'}`}>
              {moment(day).format("dddd, DD MMMM YYYY")}
            </h3>

            {/* Całodniowe */}
            {allDayEvents.length > 0 && (
              <div className="agenda-all-day">
                {allDayEvents.map(e => (
                  <div
                    key={e.id}
                    className={`agenda-event all-day ${isDarkMode ? 'dark-mode-event' : 'light-mode-event'}`}
                    style={{ borderLeftColor: e.color }}
                  >
                    {e.title} <span className="all-day-label">Cały dzień</span>
                  </div>
                ))}
              </div>
            )}

            {/* Godzinowe */}
            {timedEvents.length > 0 && (
              <div className="agenda-timed">
                {timedEvents.map(e => (
                  <div
                    key={e.id}
                    className={`agenda-event timed ${isDarkMode ? 'dark-mode-event' : 'light-mode-event'}`}
                    style={{ borderLeftColor: e.color }}
                  >
                    <span className="event-time">{moment(e.start).format("HH:mm")} – {moment(e.end).format("HH:mm")}</span>
                    <span className="event-title">{e.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
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
              <button onClick={() => setCurrentDate(new Date())} className="glow-button">Dzisiaj</button>
              <button onClick={() => setCurrentDate(moment(currentDate).subtract(1, view).toDate())} className="glow-button" style={{ margin: '0 5px' }}>{'<'}</button>
              <button onClick={() => setCurrentDate(moment(currentDate).add(1, view).toDate())} className="glow-button">{'>'}</button>
              <span className="current-month-label" style={{ marginLeft: '20px' }}>
                {view === 'month' && moment(currentDate).format('MMMM YYYY')}
                {view === 'week' && `${moment(currentDate).startOf('week').format('DD.MM')} - ${moment(currentDate).endOf('week').format('DD.MM.YYYY')}`}
                {view === 'day' && moment(currentDate).format('D MMMM YYYY')}
                {view === 'agenda' && moment(currentDate).format('MMMM YYYY')}
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
              <CustomAgenda events={events} currentDate={currentDate} />
            ) : (
              <>
                <Calendar
                  localizer={localizer}
                  events={events.map(event => ({ ...event, allDay: event.all_day }))}
                  style={{ height: 'calc(100vh - 200px)' }}
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
                      color: '#3b82f6',
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
                  components={{ event: EventComponent }}
                  eventPropGetter={(event) => {
                    const isPast = new Date(event.end) < new Date();
                    return {
                      style: {
                        backgroundColor: event.color || '#3b82f6',
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