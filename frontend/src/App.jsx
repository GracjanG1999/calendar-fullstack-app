import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/dist/locale/pl';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './index.css';

// --- KONFIGURACJA CZASU ---
moment.locale('pl'); // Ustawienie języka polskiego dla biblioteki moment
const localizer = momentLocalizer(moment); // Powiązanie kalendarza z moment.js

function App() {
  // --- STANY KOMPONENTU (STATE) ---
  const [events, setEvents] = useState([]); // Przechowuje listę wszystkich wydarzeń
  const [currentDate, setCurrentDate] = useState(new Date()); // Aktualnie wyświetlana data w kalendarzu
  const [view, setView] = useState('month'); // Aktualny widok (miesiąc, tydzień, dzień, agenda)
  const [isModalOpen, setIsModalOpen] = useState(false); // Czy okno edycji/dodawania jest otwarte
  const [agendaDate, setAgendaDate] = useState(new Date()); // Data startowa dla widoku Agendy
  
  // Dostępne kolory dla etykiet wydarzeń
  const EVENT_COLORS = [
    { name: 'Niebieski', value: '#3b82f6' },
    { name: 'Zielony', value: '#10b981' },
    { name: 'Żółty', value: '#f59e0b' },
    { name: 'Czerwony', value: '#ef4444' },
    { name: 'Fiolet', value: '#8b5cf6' },
    { name: 'Brązowy', value: '#78350f' },
    { name: 'Różowy', value: '#ec4899' },
  ];

  // Stan formularza dla nowego lub edytowanego wydarzenia
  const [newEvent, setNewEvent] = useState({
    id: null,
    title: '',
    start: null,
    end: null,
    startTime: "",
    endTime: "",
    isRecurring: false,
    selectedDays: [],
    color: EVENT_COLORS[0].value
  });

  // Lista dni tygodnia do wyboru w wydarzeniach cyklicznych
  const daysOfWeek = [
    { id: '1', label: 'Pon' }, { id: '2', label: 'Wt' }, { id: '3', label: 'Śr' },
    { id: '4', label: 'Czw' }, { id: '5', label: 'Pt' }, { id: '6', label: 'Sob' }, { id: '0', label: 'Ndz' }
  ];

  // --- FUNKCJE POMOCNICZE ---

  // Przełączanie zaznaczenia dnia w trybie cyklicznym
  const toggleDay = (dayId) => {
    setNewEvent(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId) 
        ? prev.selectedDays.filter(d => d !== dayId)
        : [...prev.selectedDays, dayId]
    }));
  };

  // Generowanie etykiety zakresu dat dla widoku tygodnia (np. 01.01 - 07.01.2024)
  const getWeekRangeLabel = () => {
    const startOfWeek = moment(currentDate).startOf('week').format('DD.MM');
    const endOfWeek = moment(currentDate).endOf('week').format('DD.MM.YYYY');
    return `${startOfWeek} – ${endOfWeek}`;
  };

  // Zwraca tekst relatywny (np. "Dzisiaj", "Jutro", "za 3 dni")
  const getRelativeDateLabel = (date) => {
    if (!date) return "";
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(date); target.setHours(0,0,0,0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if(diffDays===0) return "Dzisiaj";
    if(diffDays===1) return "Jutro";
    if(diffDays===-1) return "Wczoraj";
    if(diffDays>1) return `za ${diffDays} dni`;
    if(diffDays<-1) return `${Math.abs(diffDays)} dni temu`;
    return "";
  };

  // Komponent renderujący pojedynczy wiersz w widoku Agendy
  const AgendaEventComponent = ({ event }) => (
    <div className="agenda-event-info">
      <span style={{ fontWeight: 'bold' }}>{event.title}</span>
    </div>
  );

  // Obsługa nieskończonego przewijania (scroll) w widoku Agendy
  const handleAgendaScroll = (e) => {
    if (view !== 'agenda') return;
    
    const scrollContainer = e.target;
    const isNearTop = scrollContainer.scrollTop < 100;
    const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
    
    if (isNearTop && agendaDate) {
      const newDate = moment(agendaDate).subtract(10, 'days').toDate();
      setAgendaDate(newDate);
    }
    
    if (isNearBottom && agendaDate) {
      const newDate = moment(agendaDate).add(10, 'days').toDate();
      setAgendaDate(newDate);
    }
  };

  // --- EFEKTY (SIDE EFFECTS) ---

  // Rejestracja scrolla dla widoku Agendy
  useEffect(() => {
    const agendaView = document.querySelector('.rbc-agenda-view');
    if (agendaView) {
      agendaView.addEventListener('scroll', handleAgendaScroll);
      return () => agendaView.removeEventListener('scroll', handleAgendaScroll);
    }
  }, [view, agendaDate]);

  // Pobranie danych z API przy starcie aplikacji
  useEffect(() => {
    fetchEvents();
  }, []);

  // --- LOGIKA BIZNESOWA ---

  // Przesunięcie widoku do dzisiaj lub najbliższego wydarzenia
  const goToTodayOrFuture = () => {
    const today = moment().startOf('day');
    const futureEvents = events
      .map(e => moment(e.start).startOf('day'))
      .filter(d => d.isSameOrAfter(today))
      .sort((a, b) => a.diff(b));

    let targetDate;
    if (futureEvents.length > 0) {
      targetDate = futureEvents[0].toDate();
    } else {
      targetDate = new Date();
    }
    setCurrentDate(targetDate);
    setAgendaDate(targetDate);
  };

  // Pobieranie wydarzeń z serwera i przetwarzanie reguł cykliczności
  const fetchEvents = () => {
    axios.get('http://127.0.0.1:8000/api/events/')
      .then(res => {
        let allEvents = [];

        res.data.forEach(event => {
          let originalStart = new Date(event.start);
          let originalEnd = new Date(event.end);

          // Ustawianie godzin dla wydarzeń całodniowych lub z konkretnym czasem
          if (event.all_day) {
            originalStart.setHours(0, 0, 0, 0);
            originalEnd.setHours(23, 59, 59, 999);
          } else if (event.r_start_time && event.r_end_time) {
            const [sH, sM] = event.r_start_time.split(':');
            const [eH, eM] = event.r_end_time.split(':');
            originalStart.setHours(parseInt(sH), parseInt(sM), 0, 0);
            originalEnd.setHours(parseInt(eH), parseInt(eM), 0, 0);
          }

          allEvents.push({
            ...event,
            start: new Date(originalStart),
            end: new Date(originalEnd),
          });

          // Logika powielania wydarzeń cyklicznych na 1 rok w przód
          if (event.is_recurring && event.recurring_days) {
            const daysToRepeat = event.recurring_days.split(',');
            let currentTrack = moment(originalStart).add(1, 'day');
            const stopDate = moment(originalStart).add(1, 'year');

            while (currentTrack.isBefore(stopDate)) {
              if (daysToRepeat.includes(currentTrack.day().toString())) {
                let newStart = new Date(currentTrack);
                let newEnd = new Date(currentTrack);

                if (event.all_day) {
                  newStart.setHours(0,0,0,0);
                  newEnd.setHours(23,59,59,999);
                } else if (event.r_start_time && event.r_end_time) {
                  const [sH, sM] = event.r_start_time.split(':');
                  const [eH, eM] = event.r_end_time.split(':');
                  newStart.setHours(parseInt(sH),parseInt(sM),0,0);
                  newEnd.setHours(parseInt(eH),parseInt(eM),0,0);
                }

                allEvents.push({
                  ...event,
                  id: `${event.id}-rec-${currentTrack.format('YYYYMMDD')}`,
                  start: newStart,
                  end: newEnd,
                  is_clone: true,
                  color: event.color
                });
              }
              currentTrack.add(1, 'day');
            }
          }
        });

        setEvents(allEvents);

        // Ustawienie widoku na najbliższe wydarzenie po załadowaniu
        if(allEvents.length){
          const sortedDays = allEvents
            .map(e => moment(e.start).startOf('day'))
            .sort((a,b) => a.diff(b));
          const today = moment().startOf('day');
          const nearest = sortedDays.find(d => d.isSameOrAfter(today)) || sortedDays[0] || today;
          setAgendaDate(nearest.toDate());
          setCurrentDate(nearest.toDate());
        }
      })
      .catch(err => console.error("Błąd pobierania:", err));
  };

  // Zapisywanie nowego lub aktualizacja istniejącego wydarzenia
  const handleSave = () => {
    if(!newEvent.title) return alert("Tytuł jest niezbędny!");
    const isAllDay = !newEvent.startTime || !newEvent.endTime;
    let finalStart = new Date(newEvent.start);
    let finalEnd = new Date(newEvent.start);

    if(isAllDay){
      finalStart.setHours(0,0,0,0);
      finalEnd.setHours(23,59,59,999);
    } else {
      const [sH,sM] = newEvent.startTime.split(':');
      const [eH,eM] = newEvent.endTime.split(':');
      finalStart.setHours(parseInt(sH),parseInt(sM),0);
      finalEnd.setHours(parseInt(eH),parseInt(eM),0);
    }

    const payload = {
      title: newEvent.title,
      start: finalStart.toISOString(),
      end: finalEnd.toISOString(),
      all_day: isAllDay,
      is_recurring: newEvent.isRecurring,
      recurring_days: newEvent.isRecurring ? newEvent.selectedDays.join(',') : "",
      r_start_time: !isAllDay ? newEvent.startTime : null,
      r_end_time: !isAllDay ? newEvent.endTime : null,
      color: newEvent.color
    };

    const url = newEvent.id 
      ? `http://127.0.0.1:8000/api/events/${newEvent.id}/`
      : 'http://127.0.0.1:8000/api/events/';
    const method = newEvent.id ? 'put' : 'post';

    axios[method](url,payload)
      .then(()=> {
        fetchEvents();
        setIsModalOpen(false);
        setNewEvent({ id:null, title:'', start:null, end:null, startTime:'', endTime:'', isRecurring:false, selectedDays:[] });
      })
      .catch(err => { console.error(err); alert("Błąd zapisu!"); });
  };

  // Usuwanie wydarzenia z bazy
  const handleDelete = (eventId) => {
    if(!window.confirm("Czy na pewno chcesz usunąć to wydarzenie?")) return;
    axios.delete(`http://127.0.0.1:8000/api/events/${eventId}/`)
      .then(()=> { fetchEvents(); setIsModalOpen(false); setNewEvent({ id:null, title:'', start:null, end:null, startTime:'', endTime:'', isRecurring:false, selectedDays:[] }); })
      .catch(err => { console.error("Błąd usuwania:", err); alert("Błąd usuwania wydarzenia!"); });
  };

  // Obsługa zmiany daty w kalendarzu
  const handleNavigate = (newDate) => {
    setCurrentDate(moment(newDate).startOf('day').toDate());
  };

  // Komponent renderujący wygląd wydarzenia w widoku miesiąca/tygodnia
  const EventComponent = ({ event, view }) => {
    const formatTime = (time) => !time ? "" : time.length>5 ? time.slice(0,5) : time;
    const isAgenda = view==='agenda';
    return (
      <div style={{ fontSize:'11px', display:'flex', alignItems:'center', whiteSpace:'nowrap', overflow:'hidden' }}>
        {!isAgenda && !event.all_day && event.r_start_time && event.r_end_time && (
          <span style={{ fontWeight:'bold', marginRight:'6px', color:'#ffcc00', flexShrink:0 }}>
            {formatTime(event.r_start_time)}-{formatTime(event.r_end_time)}
          </span>
        )}
        <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{event.title}</span>
      </div>
    );
  };

  // Znajdowanie początkowej daty dla Agendy (dzisiaj lub najbliższa przyszłość)
  const getInitialAgendaDate = () => {
    if (!events.length) return moment().startOf('day').toDate();
    const today = moment().startOf('day');
    const futureDates = events
      .map(e => moment(e.start).startOf('day'))
      .filter(d => d.isSameOrAfter(today))
      .sort((a, b) => a.diff(b));
    if (futureDates.length) return futureDates[0].toDate();
    const lastEvent = events.reduce((max, e) => moment(e.start).isAfter(moment(max.start)) ? e : max);
    return moment(lastEvent.start).startOf('day').toDate();
  };

  const visibleEvents = events;

  // --- RENDEROWANIE INTERFEJSU ---
  return (
    <div className="main-container">
      <h1 className="main-title">Kalendarz</h1>

      {/* PASEK NAWIGACJI (PRZYCISKI STERUJĄCE) */}
      <div className="nav-bar">
      {view !== 'agenda' && (
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <button onClick={()=>setCurrentDate(new Date())} className="glow-button">Dzisiajszy dzień</button>
          <button onClick={()=>setCurrentDate(moment(currentDate).subtract(1, view==='month'?'month':(view==='week'||view==='agenda')?'week':'day').toDate())} className="glow-button">{'<'}</button>
          <button onClick={()=>setCurrentDate(moment(currentDate).add(1, view==='month'?'month':(view==='week'||view==='agenda')?'week':'day').toDate())} className="glow-button">{'>'}</button>
          <span className="current-month-label">
            {view==='week' ? getWeekRangeLabel() : view==='day' ? moment(currentDate).format('D MMMM') : moment(currentDate).format('MMMM YYYY')}
          </span>
        </div>
      )}

      {/* PRZEŁĄCZNIKI WIDOKÓW */}
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={()=>setView('month')} className={`glow-button ${view==='month'?'active-view':''}`}>Miesiąc</button>
        <button onClick={()=>setView('week')} className={`glow-button ${view==='week'?'active-view':''}`}>Tydzień</button>
        <button onClick={()=>setView('day')} className={`glow-button ${view==='day'?'active-view':''}`}>Dzień</button>
        <button onClick={()=>setView('agenda')} className={`glow-button ${view==='agenda'?'active-view':''}`}>Agenda</button>
      </div>
    </div>

      {/* GŁÓWNY KOMPONENT KALENDARZA */}
      <Calendar
        localizer={localizer}
        events={visibleEvents}
        selectable
        defaultDate={currentDate}
        view={view}
        onView={setView}
        date={view === 'agenda' ? (agendaDate || getInitialAgendaDate()) : currentDate}
        onNavigate={(date)=>{
          if(view === 'agenda') setAgendaDate(date);
          else handleNavigate(date);
        }}      
        getNow={()=>moment().startOf('day').toDate()}
        toolbar={false}
        culture="pl"
        style={{ height:'75vh', width:'100%' }}
        popup={true}
        length={730}
        components={{
          event: (props)=><EventComponent {...props} view={view}/>,
          agenda: {
            event: AgendaEventComponent,
            date: (props)=>{
              const actualDate = props.date || props.day;
              const relative = getRelativeDateLabel(actualDate);
              const isToday = relative==="Dzisiaj";
              return (
                <div className="custom-agenda-date-label">
                  {props.label} {relative && <span className={`relative-date-tag ${isToday?'relative-date-today':''}`}>— {relative}</span>}
                </div>
              );
            },
            time: ({event,label})=><div className="custom-agenda-time-label">{event.all_day ? "Cały dzień" : label}</div>
          }
        }}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="all_day"
        showMultiDayTimes={false}
        onSelectEvent={(event)=>{
          const isClone = event.id && String(event.id).includes('-rec-');
          const originalId = isClone ? String(event.id).split('-rec-')[0] : event.id;
          setNewEvent({
            id: originalId,
            title: event.title,
            start: event.start,
            end: event.end,
            startTime: event.r_start_time || "",
            endTime: event.r_end_time || "",
            isRecurring: event.is_recurring || false,
            selectedDays: event.recurring_days ? event.recurring_days.split(',') : [],
            color: event.color || EVENT_COLORS[0].value
          });
          setIsModalOpen(true);
        }}
        onSelectSlot={({start,end})=>{
          const cleanStart = new Date(start); cleanStart.setHours(0,0,0,0);
          setNewEvent({ id:null, start:cleanStart, end:cleanStart, title:'', startTime:'', endTime:'', isRecurring:false, selectedDays:[] });
          setIsModalOpen(true);
        }}
        dayPropGetter={(date)=>{
          const today = new Date();
          const isToday = date.getDate()===today.getDate() && date.getMonth()===today.getMonth() && date.getFullYear()===today.getFullYear();
          if(isToday) return { style:{ backgroundColor:'#333', color:'#3b82f6', fontWeight:'bold', border:'1px solid #444' } };
          return {};
        }}
        views={['month','week','day','agenda']}
        messages={{ today:"Teraz", previous:"<", next:">", month:"Miesiąc", week:"Tydzień", day:"Dzień", agenda:"Agenda", allDay:"Całodzienne" }}
        eventPropGetter={(event) => {
          const isPast = new Date(event.end) < new Date();
          const eventColor = event.color || '#3b82f6'; 

          // Stylizacja wydarzeń w widoku Agendy
          if (view === 'agenda') {
            return {
              style: {
                backgroundColor: 'transparent',
                color: isPast ? '#666' : eventColor,
                borderLeft: `5px solid ${eventColor}`,
                paddingLeft: '10px',
                opacity: isPast ? 0.5 : 1,
                display: 'block'
              }
            };
          }

          // Stylizacja bloków wydarzeń w widoku siatki
          return {
            style: {
              backgroundColor: eventColor,
              border: `1px solid ${eventColor}`,
              opacity: isPast ? 0.4 : 1,
              borderRadius: '4px',
              color: 'white',
              display: 'block',
              transition: 'all 0.3s ease'
            }
          };
        }}
        formats={{
          eventTimeRangeFormat: ({start}, culture, localizer)=>localizer.format(start,'HH:mm',culture),
          dayHeaderFormat: (date, culture, localizer)=>localizer.format(date,'dddd, D MMMM YYYY',culture),
          dayFormat: (date, culture, localizer)=>localizer.format(date,'ddd D.MM',culture),
          agendaDateFormat: (date, culture, localizer)=>localizer.format(date,'D MMMM (dddd)',culture),
          agendaTimeRangeFormat: ({start,end}, culture, localizer)=>localizer.format(start,'HH:mm',culture)+' - '+localizer.format(end,'HH:mm',culture)
        }}
      />

      {/* OKNO MODALNE (FORMULARZ DODAWANIA/EDYCJI) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <h2 className="modal-title">Dodaj Wydarzenie</h2>
            <div className="selected-date-badge">{moment(newEvent.start).format('DD MMMM YYYY')}</div>
            
            <div className="type-selector">
              <button className={!newEvent.isRecurring ? 'active-type' : ''} onClick={() => setNewEvent({ ...newEvent, isRecurring: false })}>Jednorazowe</button>
              <button className={newEvent.isRecurring ? 'active-type' : ''} onClick={() => setNewEvent({ ...newEvent, isRecurring: true })}>Cykliczne</button>
            </div>

            <input className="glow-input" placeholder="Nazwa wydarzenia..." value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
            
            <div className="time-picker-container">
              <div className="time-field"><label>Start (opcjonalnie)</label><input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} /></div>
              <div className="time-field"><label>Koniec (opcjonalnie)</label><input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} /></div>
            </div>
            
            <p style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '-10px' }}>Pozostaw puste dla wydarzenia całodniowego</p>

            {/* SEKCJA DNI CYKLICZNYCH */}
            {newEvent.isRecurring && (
              <div className="days-selector" style={{ marginTop: '20px' }}>
                <p>Powtarzaj w dni:</p>
                <div className="days-grid">
                  {daysOfWeek.map(day => (
                    <button key={day.id} className={newEvent.selectedDays.includes(day.id) ? 'day-btn active' : 'day-btn'} onClick={() => toggleDay(day.id)}>{day.label}</button>
                  ))}
                </div>
                <button className="select-all-btn" onClick={() => setNewEvent({ ...newEvent, selectedDays: ['1', '2', '3', '4', '5', '6', '0'] })}>Cały tydzień (Deadline/Spotkania)</button>
              </div>
            )}

            {/* WYBÓR KOLORU ETYKIETY */}
            <div className="color-selection-wrapper" style={{ marginTop: '25px', marginBottom: '10px' }}>
              <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Kolor etykiety</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {EVENT_COLORS.map((c) => (
                  <div
                    key={c.value}
                    onClick={() => setNewEvent({ ...newEvent, color: c.value })}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: c.value,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: newEvent.color === c.value ? '3px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                      boxShadow: newEvent.color === c.value ? `0 0 12px ${c.value}` : 'none',
                      transition: 'all 0.2s ease',
                      transform: newEvent.color === c.value ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* PRZYCISKI AKCJI W MODALU */}
            <div className="modal-buttons" style={{ marginTop: '20px' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn-cancel">Anuluj</button>
              {newEvent.id && <button onClick={() => handleDelete(newEvent.id)} className="btn-delete" style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', padding: '10px 20px', cursor: 'pointer' }}>Usuń</button>}
              <button onClick={handleSave} className="btn-save">{newEvent.id ? 'Zaktualizuj Plan' : 'Zapisz Plan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;