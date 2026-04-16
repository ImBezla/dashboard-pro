'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, DragEvent } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const [dropTargetDate, setDropTargetDate] = useState<Date | null>(null);
  const [moveMessage, setMoveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showUnplannedSidebar, setShowUnplannedSidebar] = useState(true);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
  });

  // Mutation for moving events via drag & drop
  const moveEventMutation = useMutation({
    mutationFn: async ({ eventId, eventType, newDate, eventTitle }: { eventId: string; eventType: string; newDate: Date; eventTitle: string }) => {
      const formattedDate = newDate.toISOString();
      
      if (eventType === 'event') {
        await api.patch(`/calendar/${eventId}`, { startDate: formattedDate });
      } else if (eventType === 'task') {
        await api.patch(`/tasks/${eventId}`, { deadline: formattedDate });
      } else if (eventType === 'project') {
        await api.patch(`/projects/${eventId}`, { deadline: formattedDate });
      }
      
      return { eventTitle, newDate };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setMoveMessage({ 
        text: `"${data.eventTitle}" verschoben auf ${format(data.newDate, 'd. MMM', { locale: de })}`, 
        type: 'success' 
      });
      setTimeout(() => setMoveMessage(null), 3000);
    },
    onError: () => {
      setMoveMessage({ text: 'Fehler beim Verschieben', type: 'error' });
      setTimeout(() => setMoveMessage(null), 3000);
    },
  });

  const handleDragStart = (e: DragEvent, event: any) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    // Add drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = event.title;
    dragImage.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: #6366f1; color: white; border-radius: 6px; font-size: 12px;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetDate(date);
  };

  const handleDragLeave = () => {
    setDropTargetDate(null);
  };

  const handleDrop = (e: DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDropTargetDate(null);
    
    if (draggedEvent && !isSameDay(draggedEvent.date, targetDate)) {
      const eventId = draggedEvent.id.replace(/^(event|task|project)-/, '');
      const eventType = draggedEvent.type;
      const eventTitle = draggedEvent.title;
      
      // Preserve the time from the original event
      const originalTime = draggedEvent.date;
      const newDate = new Date(targetDate);
      if (originalTime) {
        newDate.setHours(originalTime.getHours(), originalTime.getMinutes());
      }
      
      moveEventMutation.mutate({ eventId, eventType, newDate, eventTitle });
    }
    setDraggedEvent(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: calendarEvents } = useQuery({
    queryKey: ['calendar', monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async () => {
      try {
        const response = await api.get(
          `/calendar?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
        );
        return response.data;
      } catch (error) {
        console.error('Failed to load calendar events:', error);
        return [];
      }
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const response = await api.get('/tasks');
        return response.data;
      } catch (error) {
        return [];
      }
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await api.get('/projects');
        return response.data;
      } catch (error) {
        return [];
      }
    },
  });

  // Kombiniere Calendar Events, Tasks und Projekte zu Events (mit Zeit für Sortierung)
  const events = [
    ...(calendarEvents || []).map((event: CalendarEvent) => ({
      id: `event-${event.id}`,
      title: event.title,
      description: event.description,
      date: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : null,
      type: 'event',
      color: 'purple',
      hasTime: true,
    })),
    ...(tasks || []).map((task: any) => {
      const d = task.deadline ? new Date(task.deadline) : null;
      return {
        id: `task-${task.id}`,
        title: task.title,
        date: d,
        endDate: null,
        type: 'task',
        color: task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'yellow' : 'green',
        hasTime: d ? d.getHours() !== 0 || d.getMinutes() !== 0 : false,
      };
    }),
    ...(projects || []).map((project: any) => {
      const d = project.deadline ? new Date(project.deadline) : null;
      return {
        id: `project-${project.id}`,
        title: project.name,
        date: d,
        endDate: null,
        type: 'project',
        color: 'blue',
        hasTime: d ? d.getHours() !== 0 || d.getMinutes() !== 0 : false,
      };
    }),
  ].filter((event) => event.date);

  // Ungeplante Aufgaben (ohne Deadline)
  const unplannedTasks = (tasks || [])
    .filter((task: any) => !task.deadline && task.status !== 'DONE')
    .map((task: any) => ({
      id: `task-${task.id}`,
      title: task.title,
      date: null,
      type: 'task',
      color: task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'yellow' : 'green',
      priority: task.priority,
      status: task.status,
    }));

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => event.date && isSameDay(event.date, date));
  };

  /** Ereignisse des Tages nach Uhrzeit sortiert (für Tagesstruktur) */
  const getDayEventsSortedByTime = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    return [...dayEvents].sort((a, b) => (a.date!.getTime() - b.date!.getTime()));
  };

  const getDayEvents = (date: Date) => {
    return getEventsForDate(date);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    setEventForm({
      title: '',
      description: '',
      date: formattedDate,
      time: '',
    });
  };

  const handleEventClick = (event: any) => {
    if (event.type === 'event') {
      // Open edit modal for calendar events
      const eventId = event.id.replace('event-', '');
      const calEvent = calendarEvents?.find((e: CalendarEvent) => e.id === eventId);
      if (calEvent) {
        const startDate = new Date(calEvent.startDate);
        setEditingEventId(eventId);
        setEventForm({
          title: calEvent.title,
          description: calEvent.description || '',
          date: format(startDate, 'yyyy-MM-dd'),
          time: format(startDate, 'HH:mm'),
        });
        setShowEventModal(true);
      }
    } else if (event.type === 'task') {
      const taskId = event.id.replace('task-', '');
      window.location.href = `/tasks/${taskId}`;
    } else if (event.type === 'project') {
      const projectId = event.id.replace('project-', '');
      window.location.href = `/projects/${projectId}`;
    }
  };

  const resetForm = () => {
    setShowEventModal(false);
    setEditingEventId(null);
    setEventForm({ title: '', description: '', date: '', time: '' });
    setError('');
  };

  return (
    <div>
      {/* Toast for drag & drop feedback */}
      {moveMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slideIn ${
          moveMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {moveMessage.type === 'success' ? '✓' : '✕'} {moveMessage.text}
        </div>
      )}
      
      {/* Drag indicator */}
      {draggedEvent && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-primary text-white rounded-lg shadow-lg text-sm">
          🖐️ "{draggedEvent.title}" auf einen Tag ziehen zum Verschieben
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-black text-dark mb-1 sm:mb-2">Termine</h1>
          <p className="text-sm sm:text-lg text-text-light">
            Verwalten Sie Ihre Termine und Meetings
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowUnplannedSidebar(!showUnplannedSidebar)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors min-h-[44px] touch-manipulation ${
              showUnplannedSidebar 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                : 'bg-white border border-border text-text hover:bg-light'
            }`}
          >
            📋 Ungeplant ({unplannedTasks.length})
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-primary text-white px-5 sm:px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors min-h-[44px] touch-manipulation"
          >
            + Neuer Termin
          </button>
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-4 sm:gap-6 ${showUnplannedSidebar ? '' : ''}`}>
        {/* Ungeplante Aufgaben Sidebar – auf Mobil oben, ab lg links */}
        {showUnplannedSidebar && (
          <div className="w-full lg:w-72 lg:shrink-0 order-first lg:order-none">
            <div className="bg-white rounded-xl shadow border border-border lg:sticky lg:top-4">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-dark flex items-center gap-2">
                  📋 Ungeplante Aufgaben
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {unplannedTasks.length}
                  </span>
                </h3>
                <p className="text-xs text-text-light mt-1">
                  Ziehen Sie Aufgaben auf einen Tag im Kalender
                </p>
              </div>
              <div className="max-h-[280px] sm:max-h-[400px] lg:max-h-[500px] overflow-y-auto">
                {unplannedTasks.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {unplannedTasks.map((task: any) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { ...task, date: new Date() })}
                        onDragEnd={() => setDraggedEvent(null)}
                        className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md transition-all touch-manipulation min-h-[44px] flex flex-col justify-center ${
                          task.color === 'red' ? 'bg-red-50 border-red-200' :
                          task.color === 'yellow' ? 'bg-amber-50 border-amber-200' :
                          'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="font-medium text-sm text-dark truncate">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                            task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {task.priority === 'HIGH' ? 'Hoch' : task.priority === 'MEDIUM' ? 'Mittel' : 'Niedrig'}
                          </span>
                          <span className="text-xs text-text-light">
                            {task.status === 'IN_PROGRESS' ? 'In Arbeit' : 'Offen'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-text-light">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-sm">Alle Aufgaben sind geplant!</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-border">
                <button
                  onClick={() => window.location.href = '/tasks/new'}
                  className="w-full text-sm text-primary hover:text-primary-dark font-medium py-2.5 min-h-[44px] touch-manipulation"
                >
                  + Neue Aufgabe erstellen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kalender */}
        <div className="flex-1 min-w-0">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow border border-border mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2.5 sm:p-2 hover:bg-light rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Vorheriger Monat"
            >
              ←
            </button>
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-dark min-w-[140px] sm:min-w-[180px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: de })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2.5 sm:p-2 hover:bg-light rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Nächster Monat"
            >
              →
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-text-light hidden sm:block">💡 Termine per Drag & Drop verschieben</span>
            <button
              onClick={goToToday}
              className="px-4 py-2.5 sm:py-2 rounded-lg border border-border bg-white hover:bg-light font-medium text-sm transition-colors min-h-[44px] touch-manipulation"
            >
              Heute
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
            <div key={day} className="text-center font-semibold text-text-light py-1 sm:py-2 text-xs sm:text-sm">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Fill in days from previous month */}
          {(() => {
            const firstDay = daysInMonth[0];
            const weekStart = startOfWeek(firstDay, { weekStartsOn: 1 });
            const dayBefore = new Date(firstDay.getTime() - 24 * 60 * 60 * 1000);
            
            // Only show days before if weekStart is before the first day
            if (weekStart <= dayBefore) {
              try {
                const daysBefore = eachDayOfInterval({ 
                  start: weekStart, 
                  end: dayBefore 
                });
                return daysBefore.map((day) => (
                  <div
                    key={`prev-${day.toISOString()}`}
                    className="min-h-16 sm:min-h-24 p-1.5 sm:p-2 border border-border rounded-lg opacity-30"
                  >
                    <div className="text-xs sm:text-sm font-semibold text-text-light">
                      {format(day, 'd')}
                    </div>
                  </div>
                ));
              } catch (error) {
                // If interval is invalid, return empty array
                return [];
              }
            }
            return [];
          })()}
          
          {daysInMonth.map((day) => {
            const dayEvents = getDayEvents(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDropTarget = draggedEvent && !isSameDay(draggedEvent.date, day);

            const isDropHere = dropTargetDate && isSameDay(dropTargetDate, day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                className={`min-h-16 sm:min-h-24 p-1.5 sm:p-2 border-2 rounded-lg cursor-pointer hover:bg-light transition-all duration-200 touch-manipulation ${
                  isSelected ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'border-border'
                } ${!isCurrentMonth ? 'opacity-50' : ''} ${isSameDay(day, new Date()) ? 'ring-1 ring-primary' : ''} ${
                  isDropHere ? 'border-dashed border-primary bg-primary/10 scale-105' : ''
                } ${isDropTarget && !isDropHere ? 'opacity-70' : ''}`}
              >
                <div className={`text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 ${
                  isSelected ? 'text-primary' : 
                  isSameDay(day, new Date()) ? 'text-primary font-black' : 
                  'text-dark'
                }`}>
                  {format(day, 'd')}
                  {isSameDay(day, new Date()) && (
                    <span className="ml-1 text-xs">●</span>
                  )}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, event)}
                      onDragEnd={() => setDraggedEvent(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity touch-manipulation ${
                        event.color === 'red' ? 'bg-red-100 text-red-700' :
                        event.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        event.color === 'green' ? 'bg-green-100 text-green-700' :
                        event.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      } ${draggedEvent?.id === event.id ? 'opacity-50' : ''}`}
                      title={`${event.title} (Ziehen zum Verschieben)`}
                    >
                      {event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-text-light">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Fill in days from next month */}
          {(() => {
            const lastDay = daysInMonth[daysInMonth.length - 1];
            const weekEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
            const nextDay = new Date(lastDay.getTime() + 24 * 60 * 60 * 1000);
            
            // Only show days after if weekEnd is after the last day
            if (weekEnd >= nextDay) {
              try {
                const daysAfter = eachDayOfInterval({ 
                  start: nextDay, 
                  end: weekEnd 
                });
                return daysAfter.map((day) => (
                  <div
                    key={`next-${day.toISOString()}`}
                    className="min-h-16 sm:min-h-24 p-1.5 sm:p-2 border border-border rounded-lg opacity-30"
                  >
                    <div className="text-xs sm:text-sm font-semibold text-text-light">
                      {format(day, 'd')}
                    </div>
                  </div>
                ));
              } catch (error) {
                // If interval is invalid, return empty array
                return [];
              }
            }
            return [];
          })()}
        </div>
      </div>
        </div>
      </div>

      {/* Tagesstruktur: Termine des gewählten Tages chronologisch */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-dark">
            Tagesübersicht · {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
          </h2>
          <button
            onClick={() => {
              setEventForm({
                ...eventForm,
                date: format(selectedDate, 'yyyy-MM-dd'),
              });
              setShowEventModal(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm shrink-0"
          >
            + Termin an diesem Tag
          </button>
        </div>
        <div className="space-y-2">
          {getDayEventsSortedByTime(selectedDate).length > 0 ? (
            getDayEventsSortedByTime(selectedDate).map((event) => {
              const timeLabel = event.hasTime && event.date
                ? format(event.date, 'HH:mm', { locale: de })
                : 'Ganztägig';
              const endLabel = event.endDate && event.hasTime
                ? ` – ${format(event.endDate, 'HH:mm', { locale: de })}`
                : '';
              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="w-14 shrink-0 text-center">
                    <span className="text-sm font-semibold text-primary tabular-nums">{timeLabel}</span>
                    {endLabel && <span className="text-xs text-text-light">{endLabel}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-dark truncate">{event.title}</div>
                    {'description' in event && event.description && (
                      <div className="text-sm text-text-light line-clamp-2 mt-0.5">{event.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.type === 'event' ? 'bg-purple-100 text-purple-700' :
                        event.type === 'task'
                          ? event.color === 'red' ? 'bg-red-100 text-red-700' : event.color === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {event.type === 'event' ? 'Termin' : event.type === 'task' ? 'Aufgabe' : 'Projekt'}
                    </span>
                    {event.type === 'event' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Möchten Sie diesen Termin wirklich löschen?')) {
                            try {
                              const eventId = event.id.replace('event-', '');
                              await api.delete(`/calendar/${eventId}`);
                              queryClient.invalidateQueries({ queryKey: ['calendar'] });
                              queryClient.invalidateQueries({ queryKey: ['calendar', monthStart.toISOString(), monthEnd.toISOString()] });
                            } catch (error) {
                              console.error('Failed to delete event:', error);
                              alert('Fehler beim Löschen des Termins');
                            }
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-danger hover:text-red-700 transition-opacity text-sm p-1"
                        aria-label="Termin löschen"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-text-light border border-dashed border-border rounded-lg">
              <p className="font-medium">Keine Termine an diesem Tag</p>
              <p className="text-sm mt-1">Klicken Sie auf einen Tag im Kalender oder fügen Sie einen Termin hinzu.</p>
            </div>
          )}
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingEventId ? 'Termin bearbeiten' : 'Neuer Termin'}
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setIsCreating(true);
                
                try {
                  if (!eventForm.date) {
                    setError('Bitte wählen Sie ein Datum aus');
                    setIsCreating(false);
                    return;
                  }

                  if (!eventForm.title.trim()) {
                    setError('Bitte geben Sie einen Titel ein');
                    setIsCreating(false);
                    return;
                  }

                  const startDate = eventForm.date && eventForm.time
                    ? `${eventForm.date}T${eventForm.time}:00`
                    : eventForm.date
                    ? `${eventForm.date}T09:00:00`
                    : new Date().toISOString();
                  
                  const endDate = eventForm.date && eventForm.time
                    ? `${eventForm.date}T${(parseInt(eventForm.time.split(':')[0]) + 1).toString().padStart(2, '0')}:${eventForm.time.split(':')[1]}:00`
                    : eventForm.date
                    ? `${eventForm.date}T10:00:00`
                    : new Date(Date.now() + 60 * 60 * 1000).toISOString();

                  const eventData = {
                    title: eventForm.title.trim(),
                    description: eventForm.description.trim() || undefined,
                    startDate,
                    endDate: endDate || undefined,
                  };

                  if (editingEventId) {
                    // Update existing event
                    await api.patch(`/calendar/${editingEventId}`, eventData);
                  } else {
                    // Create new event
                    await api.post('/calendar', eventData);
                  }
                  
                  resetForm();
                  setSelectedDate(eventForm.date ? new Date(eventForm.date + 'T12:00:00') : new Date());
                  
                  // Invalidate all calendar queries
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['calendar'] }),
                    queryClient.invalidateQueries({ queryKey: ['calendar', monthStart.toISOString(), monthEnd.toISOString()] }),
                  ]);
                } catch (error: any) {
                  console.error('Failed to save event:', error);
                  
                  let errorMessage = editingEventId 
                    ? 'Fehler beim Aktualisieren des Termins' 
                    : 'Fehler beim Erstellen des Termins';
                  
                  if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                  } else if (error.response?.status === 401) {
                    errorMessage = 'Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.';
                  } else if (error.response?.status === 400) {
                    errorMessage = 'Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Eingaben.';
                  } else if (error.response?.status >= 500) {
                    errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
                  }
                  
                  setError(errorMessage);
                } finally {
                  setIsCreating(false);
                }
              }}
              className="space-y-4"
            >
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text mb-2">Titel</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Beschreibung</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Datum</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Uhrzeit</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-text-light mt-1">Standard: 09:00 Uhr</p>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                >
                  {isCreating 
                    ? (editingEventId ? 'Wird gespeichert...' : 'Wird erstellt...') 
                    : (editingEventId ? 'Speichern' : 'Erstellen')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isCreating}
                  className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
              </div>
              {editingEventId && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Möchten Sie diesen Termin wirklich löschen?')) {
                      try {
                        await api.delete(`/calendar/${editingEventId}`);
                        resetForm();
                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: ['calendar'] }),
                          queryClient.invalidateQueries({ queryKey: ['calendar', monthStart.toISOString(), monthEnd.toISOString()] }),
                        ]);
                      } catch (error) {
                        console.error('Failed to delete event:', error);
                        alert('Fehler beim Löschen des Termins');
                      }
                    }
                  }}
                  disabled={isCreating}
                  className="w-full text-danger hover:text-red-700 text-sm font-medium py-2 transition-colors disabled:opacity-50"
                >
                  Termin löschen
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
