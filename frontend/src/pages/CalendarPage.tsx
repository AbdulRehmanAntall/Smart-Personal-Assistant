import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Event {
  id: string;
  title: string;
  category: 'meeting' | 'assignment' | 'personal';
  startAt: Date;
}

export default function CalendarPage() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const currentMonth = monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const fromAt = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
      const toAt = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0, 23, 59, 59);
      const qs = new URLSearchParams({ from_at: fromAt.toISOString(), to_at: toAt.toISOString() });
      const data = await apiFetch<{ events: any[] }>(`/calendar/events?${qs.toString()}`);

      const mapped: Event[] = (data.events ?? []).map((item, idx) => {
        const start = item.start?.dateTime || item.start?.date || '';
        const startAt = start ? new Date(start) : new Date();
        const title = item.summary || item.description || 'Event';
        return {
          id: String(item.id ?? idx),
          title: String(title),
          category: 'meeting',
          startAt,
        };
      });
      setEvents(mapped);
    } catch (e) {
      setEvents([]);
      setError(e instanceof Error ? e.message : 'Failed to load Calendar. Re-login with Google to grant Calendar permission.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [monthCursor]);

  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const getEventsForDate = (date: number) => {
    return events.filter(event => event.startAt.getDate() === date && event.startAt.getMonth() === monthCursor.getMonth());
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'bg-[#8B5CF6]';
      case 'assignment':
        return 'bg-[#7C3AED]';
      case 'personal':
        return 'bg-[#6D28D9]';
      default:
        return 'bg-gray-500';
    }
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => e.startAt >= now)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
      .slice(0, 5);
  }, [events]);

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const monthLabelShort = monthCursor.toLocaleString(undefined, { month: 'short' });
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  const combineDateAndTime = (base: Date, hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0);
  };

  const createEventForSelectedDate = async () => {
    if (!selectedDate) {
      setError('Select a date first.');
      return;
    }
    if (!newTitle.trim()) {
      setError('Event title is required.');
      return;
    }

    const baseDate = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), selectedDate);
    const startAt = combineDateAndTime(baseDate, startTime);
    const endAt = combineDateAndTime(baseDate, endTime);
    if (endAt <= startAt) {
      setError('End time must be after start time.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await apiFetch('/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          location: newLocation.trim(),
          also_create_google: true,
        }),
      });
      setNewTitle('');
      setNewLocation('');
      setStartTime('09:00');
      setEndTime('10:00');
      setShowCreatePanel(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const deleteGoogleEvent = async (googleEventId: string) => {
    setError('');
    try {
      await apiFetch(`/calendar/events/${encodeURIComponent(googleEventId)}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Calendar</h1>
        <p className="text-lg text-white/90">Manage your schedule and upcoming events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#EDEDED]">{currentMonth}</h2>
            <div className="flex gap-2">
              <button
                className="p-2 rounded-xl hover:bg-[#171717] transition-all text-[#A3A3A3]"
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-xl hover:bg-[#171717] transition-all text-[#A3A3A3]"
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all ml-2 disabled:opacity-60"
                disabled={creating}
                onClick={() => {
                  if (!selectedDate) {
                    setError('Select a date first, then add event.');
                    return;
                  }
                  setShowCreatePanel(true);
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{creating ? 'Creating...' : 'Add Event'}</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="mb-4 text-sm text-[#A3A3A3]">Loading calendar events...</div>
          )}
          {!loading && error && (
            <div className="mb-4 p-3 rounded-xl bg-[#C2410C]/10 border border-[#C2410C]/30 text-[#EA580C] text-sm">
              {error}
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
              <span className="text-[#A3A3A3]">Meetings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#7C3AED]"></div>
              <span className="text-[#A3A3A3]">Assignments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6D28D9]"></div>
              <span className="text-[#A3A3A3]">Personal</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-[#A3A3A3] text-sm py-2">
                {day}
              </div>
            ))}

            {/* Empty days */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                monthCursor.getMonth() === today.getMonth() &&
                monthCursor.getFullYear() === today.getFullYear();
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-xl p-2 cursor-pointer transition-all relative
                    ${isToday ? 'bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] text-white' : 'bg-[#171717] hover:bg-[#1E1E1E]'}
                    ${selectedDate === day && !isToday ? 'ring-2 ring-[#7C3AED]' : ''}
                  `}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-white' : 'text-[#EDEDED]'}`}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : getCategoryColor(event.category)}`}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#7C3AED]" />
              <span className="text-[#EDEDED]">Upcoming Events</span>
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl bg-[#171717] hover:bg-[#1E1E1E] transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)} mt-2`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-[#EDEDED] text-sm">{event.title}</p>
                      <p className="text-xs text-[#A3A3A3] mt-1">
                        {event.startAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {formatTime(event.startAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-gradient-to-br from-[#7C3AED]/20 to-[#8B5CF6]/20 rounded-2xl p-6 shadow-lg border border-[#7C3AED]/30">
              <h3 className="text-lg font-bold mb-4 text-[#EDEDED]">{monthLabelShort} {selectedDate}, {monthCursor.getFullYear()}</h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-xl bg-[#1E1E1E]/60 border border-[#2A2A2A]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-[#EDEDED] text-sm truncate">{event.title}</p>
                          <p className="text-xs text-[#A3A3A3] mt-1">{formatTime(event.startAt)}</p>
                        </div>
                        <button
                          className="p-2 rounded-lg hover:bg-[#171717] transition-all text-[#A3A3A3] hover:text-[#EDEDED]"
                          title="Delete from Google Calendar"
                          onClick={() => void deleteGoogleEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#A3A3A3]">No events scheduled</p>
                )}
              </div>
              <button
                onClick={() => setShowCreatePanel((prev) => !prev)}
                className="mt-4 w-full px-4 py-2 rounded-xl bg-[#171717] text-[#EDEDED] border border-[#2A2A2A] hover:bg-[#1E1E1E] transition-all text-sm"
              >
                {showCreatePanel ? 'Hide Add Event' : 'Add Event On This Date'}
              </button>
              {showCreatePanel && (
                <div className="mt-4 p-4 rounded-xl bg-[#171717] border border-[#2A2A2A] space-y-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Event title"
                    className="w-full h-10 px-3 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] text-[#EDEDED] text-sm"
                  />
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Description / Location (optional)"
                    className="w-full h-10 px-3 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] text-[#EDEDED] text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-10 px-2 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] text-[#EDEDED] text-sm"
                    >
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-10 px-2 rounded-lg bg-[#1E1E1E] border border-[#2A2A2A] text-[#EDEDED] text-sm"
                    >
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => void createEventForSelectedDate()}
                    disabled={creating}
                    className="w-full h-10 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {creating ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}