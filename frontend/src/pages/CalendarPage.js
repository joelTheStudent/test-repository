import React, { useState, useEffect, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  parseISO, addWeeks, subWeeks, startOfDay, getHours
} from 'date-fns';
import api from '../api/axios';
import EventModal from '../components/events/EventModal';
import EventDetailModal from '../components/events/EventDetailModal';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#14b8a6'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = view === 'month'
        ? startOfWeek(startOfMonth(currentDate))
        : startOfWeek(currentDate);
      const end = view === 'month'
        ? endOfWeek(endOfMonth(currentDate))
        : endOfWeek(addWeeks(currentDate, 1));

      const { data } = await api.get('/events/', {
        params: { start: start.toISOString(), end: end.toISOString() }
      });
      setEvents(data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [currentDate, view]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const getEventsForDay = (day) =>
    events.filter(e => isSameDay(parseISO(e.start_datetime), day));

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setShowCreate(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const navigate = (dir) => {
    if (view === 'month') {
      setCurrentDate(dir === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(dir === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let day = startDate;

    while (day <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const d = day;
        const dayEvents = getEventsForDay(d);
        const inMonth = isSameMonth(d, monthStart);
        week.push(
          <div
            key={d.toString()}
            className={`cal-day ${!inMonth ? 'other-month' : ''} ${isToday(d) ? 'today' : ''}`}
            onClick={() => handleDayClick(d)}
          >
            <span className="day-number">{format(d, 'd')}</span>
            <div className="day-events">
              {dayEvents.slice(0, 3).map(ev => (
                <div
                  key={ev.id}
                  className="event-chip"
                  style={{ background: ev.color }}
                  onClick={(e) => handleEventClick(e, ev)}
                  title={ev.title}
                >
                  {format(parseISO(ev.start_datetime), 'HH:mm')} {ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="more-events">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day.toString()} className="cal-row">{week}</div>);
    }
    return rows;
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="week-view">
        <div className="week-header">
          <div className="time-gutter" />
          {days.map(d => (
            <div key={d.toString()} className={`week-day-header ${isToday(d) ? 'today' : ''}`}>
              <span className="wd-name">{format(d, 'EEE')}</span>
              <span className={`wd-num ${isToday(d) ? 'today-num' : ''}`}>{format(d, 'd')}</span>
            </div>
          ))}
        </div>
        <div className="week-body">
          <div className="time-col">
            {hours.map(h => (
              <div key={h} className="time-slot-label">
                {h === 0 ? '' : `${String(h).padStart(2,'0')}:00`}
              </div>
            ))}
          </div>
          {days.map(d => (
            <div key={d.toString()} className="week-day-col" onClick={() => handleDayClick(d)}>
              {hours.map(h => <div key={h} className="hour-cell" />)}
              {getEventsForDay(d).map(ev => {
                const hour = getHours(parseISO(ev.start_datetime));
                return (
                  <div
                    key={ev.id}
                    className="week-event"
                    style={{ top: `${hour * 60}px`, background: ev.color }}
                    onClick={(e) => handleEventClick(e, ev)}
                  >
                    <span>{ev.title}</span>
                    <span className="we-time">{format(parseISO(ev.start_datetime), 'HH:mm')}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="nav-btn" onClick={() => navigate('prev')}>‹</button>
          <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="nav-btn" onClick={() => navigate('next')}>›</button>
          <h2 className="cal-title">
            {view === 'month' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
          </h2>
        </div>
        <div className="toolbar-right">
          {loading && <span className="loading-dot" />}
          <div className="view-toggle">
            <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
            <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
          </div>
          <button className="btn-primary" onClick={() => { setSelectedDate(new Date()); setShowCreate(true); }}>
            + New Event
          </button>
        </div>
      </div>

      {view === 'month' && (
        <div className="calendar-grid">
          <div className="cal-header-row">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="cal-header-cell">{d}</div>
            ))}
          </div>
          {renderMonthView()}
        </div>
      )}

      {view === 'week' && renderWeekView()}

      {showCreate && (
        <EventModal
          defaultDate={selectedDate}
          onClose={() => { setShowCreate(false); setSelectedDate(null); }}
          onSave={() => { fetchEvents(); setShowCreate(false); }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={() => { fetchEvents(); setSelectedEvent(null); }}
          onDelete={() => { fetchEvents(); setSelectedEvent(null); }}
        />
      )}
    </div>
  );
}
