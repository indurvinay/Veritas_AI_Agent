import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, X, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function EventForm({ initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValues || { summary: '', date: '', startTime: '', endTime: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.summary || !form.date || !form.startTime || !form.endTime) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const start = `${form.date}T${form.startTime}:00`;
      const end = `${form.date}T${form.endTime}:00`;
      await onSubmit({ summary: form.summary, start, end, description: form.description });
    } catch (err) {
      toast.error('Operation failed');
    }
    setSubmitting(false);
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="glass-panel p-4 mb-4 overflow-hidden"
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input className="jarvis-input col-span-2" placeholder="Event title *" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <input className="jarvis-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <div className="flex gap-2">
          <input className="jarvis-input flex-1" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <input className="jarvis-input flex-1" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>
        <textarea className="jarvis-input col-span-2 resize-none h-20" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="glow-btn glow-btn-primary text-[10px]" disabled={submitting}>
          {submitting ? 'Saving...' : initialValues ? 'Update' : 'Create Event'}
        </button>
        <button type="button" className="glow-btn text-[10px]" onClick={onCancel}>Cancel</button>
      </div>
    </motion.form>
  );
}

export default function CalendarPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const queryClient = useQueryClient();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  // Fetch events
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => axios.get('/api/calendar/events').then((r) => r.data),
  });

  const events = data?.events || [];

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.start?.startsWith(dateStr));
  };

  const handleCreateEvent = async (eventData) => {
    await axios.post('/api/calendar/events', eventData);
    queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    toast.success('Event created!');
    setShowForm(false);
  };

  const handleUpdateEvent = async (eventData) => {
    await axios.put(`/api/calendar/events/${editingEvent.id}`, eventData);
    queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    toast.success('Event updated!');
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (eventId) => {
    await axios.delete(`/api/calendar/events/${eventId}`);
    queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    toast.success('Event deleted');
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-950/20 border border-blue-500/30"
            style={{ boxShadow: '0 0 12px rgba(66, 133, 244, 0.2)' }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="" className="w-4 h-4" />
          </div>
          <h2 className="text-lg tracking-widest font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            CALENDAR
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="glow-btn text-[10px] flex items-center gap-1" onClick={() => refetch().then(() => toast.success('Calendar events refreshed!'))}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="glow-btn glow-btn-primary text-[10px] flex items-center gap-1" onClick={() => setShowForm(true)}>
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* New Event Form */}
      <AnimatePresence>
        {showForm && <EventForm onSubmit={handleCreateEvent} onCancel={() => setShowForm(false)} />}
        {editingEvent && (
          <EventForm
            initialValues={{
              summary: editingEvent.summary,
              date: editingEvent.start?.split('T')[0] || '',
              startTime: editingEvent.start?.split('T')[1]?.slice(0, 5) || '',
              endTime: editingEvent.end?.split('T')[1]?.slice(0, 5) || '',
              description: editingEvent.description || '',
            }}
            onSubmit={handleUpdateEvent}
            onCancel={() => setEditingEvent(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-6" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Mini Calendar */}
        <div className="glass-panel p-4" style={{ width: '320px', flexShrink: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="glow-btn p-1"><ChevronLeft size={16} /></button>
            <span className="text-xs tracking-widest" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>{monthName}</span>
            <button onClick={nextMonth} className="glow-btn p-1"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-[9px] tracking-wider opacity-40" style={{ fontFamily: 'var(--font-heading)' }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
              const isSelected = selectedDate === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className="relative w-full aspect-square flex items-center justify-center rounded-md text-xs transition-all"
                  style={{
                    background: isSelected ? 'rgba(0,212,255,0.15)' : isToday ? 'rgba(0,212,255,0.08)' : 'transparent',
                    border: isToday ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                    color: isSelected ? 'var(--color-jarvis-cyan)' : 'var(--color-text-primary)',
                  }}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-jarvis-cyan)', boxShadow: '0 0 4px rgba(0,212,255,0.5)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto pr-2">
          <h3 className="text-xs tracking-widest mb-3 opacity-60" style={{ fontFamily: 'var(--font-heading)' }}>
            {selectedDate ? `EVENTS FOR ${monthName.split(' ')[0]} ${selectedDate}` : 'UPCOMING EVENTS'}
          </h3>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-panel p-4 mb-2">
                <div className="h-4 w-1/3 skeleton mb-2" />
                <div className="h-3 w-1/2 skeleton" />
              </div>
            ))
          ) : (
            (selectedDate ? events.filter((e) => {
              const d = e.start?.split('T')[0];
              const target = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
              return d === target;
            }) : events).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel glass-panel-hover p-4 mb-2"
                style={{ borderLeft: '3px solid var(--color-jarvis-cyan)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{event.summary}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-jarvis-cyan)' }}>
                      {event.start ? new Date(event.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </p>
                    {event.description && <p className="text-xs mt-1 opacity-50">{event.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button className="glow-btn p-1.5" onClick={() => setEditingEvent(event)}><Edit3 size={13} /></button>
                    <button className="glow-btn glow-btn-danger p-1.5" onClick={() => handleDeleteEvent(event.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
