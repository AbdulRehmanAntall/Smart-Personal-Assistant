import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: number;
  category: 'meeting' | 'assignment' | 'personal';
  time: string;
}

export default function CalendarPage() {
  const [currentMonth] = useState('February 2026');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const events: Event[] = [
    { id: 1, title: 'Team Project Meeting', date: 24, category: 'meeting', time: '2:00 PM' },
    { id: 2, title: 'Math Assignment Due', date: 26, category: 'assignment', time: '11:59 PM' },
    { id: 3, title: 'Gym Session', date: 27, category: 'personal', time: '6:00 PM' },
    { id: 4, title: 'CS Lab Session', date: 28, category: 'meeting', time: '10:00 AM' },
    { id: 5, title: 'Research Paper Draft', date: 2, category: 'assignment', time: '11:59 PM' },
    { id: 6, title: 'Coffee with Study Group', date: 27, category: 'personal', time: '3:00 PM' },
    { id: 7, title: 'Physics Quiz', date: 25, category: 'assignment', time: '1:00 PM' },
  ];

  const daysInMonth = 28;
  const firstDayOfWeek = 0; // Sunday
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const getEventsForDate = (date: number) => {
    return events.filter(event => event.date === date);
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

  const upcomingEvents = events
    .filter(event => event.date >= 24)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

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
              <button className="p-2 rounded-xl hover:bg-[#171717] transition-all text-[#A3A3A3]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl hover:bg-[#171717] transition-all text-[#A3A3A3]">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all ml-2">
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Event</span>
              </button>
            </div>
          </div>

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
              const isToday = day === 27;
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
                      <p className="text-xs text-[#A3A3A3] mt-1">Feb {event.date} • {event.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-gradient-to-br from-[#7C3AED]/20 to-[#8B5CF6]/20 rounded-2xl p-6 shadow-lg border border-[#7C3AED]/30">
              <h3 className="text-lg font-bold mb-4 text-[#EDEDED]">Feb {selectedDate}, 2026</h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-xl bg-[#1E1E1E]/60 border border-[#2A2A2A]"
                    >
                      <p className="font-medium text-[#EDEDED] text-sm">{event.title}</p>
                      <p className="text-xs text-[#A3A3A3] mt-1">{event.time}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#A3A3A3]">No events scheduled</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}