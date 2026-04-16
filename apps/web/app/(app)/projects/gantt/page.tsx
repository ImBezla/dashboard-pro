'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

export default function GanttChartPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter'>('month');
  const [startDate, setStartDate] = useState(new Date());

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects-gantt'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data || [];
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks-gantt'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data || [];
    },
  });

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const days = viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 90;
    const end = addDays(startDate, days);
    return eachDayOfInterval({ start: startDate, end });
  }, [startDate, viewMode]);

  const getProjectTasks = (projectId: string) => {
    return tasks?.filter((t: any) => t.projectId === projectId) || [];
  };

  const getBarPosition = (itemStart: Date | null, itemEnd: Date | null) => {
    if (!itemStart) return null;
    
    const rangeStart = startDate;
    const rangeEnd = dateRange[dateRange.length - 1];
    const totalDays = dateRange.length;
    
    const start = itemStart < rangeStart ? rangeStart : itemStart;
    const end = itemEnd && itemEnd < rangeEnd ? itemEnd : rangeEnd;
    
    if (start > rangeEnd || (itemEnd && itemEnd < rangeStart)) return null;
    
    const startOffset = differenceInDays(start, rangeStart);
    const duration = itemEnd ? differenceInDays(end, start) + 1 : 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: Math.max(0, left), width: Math.min(100 - left, width) };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
      case 'COMPLETED':
        return 'bg-green-500';
      case 'IN_PROGRESS':
      case 'ACTIVE':
        return 'bg-blue-500';
      case 'PENDING':
      case 'OPEN':
        return 'bg-amber-500';
      default:
        return 'bg-gray-400';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 90;
    setStartDate(addDays(startDate, direction === 'next' ? days : -days));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Gantt-Chart</h1>
          <p className="text-lg text-text-light">
            Visuelle Projektplanung und Zeitachse
          </p>
        </div>
        <button
          onClick={() => router.push('/projects')}
          className="text-primary hover:text-primary-dark font-medium"
        >
          ← Zurück zu Projekte
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-border mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-light rounded-lg transition-colors"
            >
              ←
            </button>
            <span className="font-semibold text-dark min-w-[200px] text-center">
              {format(startDate, 'd. MMM', { locale: de })} - {format(dateRange[dateRange.length - 1], 'd. MMM yyyy', { locale: de })}
            </span>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-light rounded-lg transition-colors"
            >
              →
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStartDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-light transition-colors"
            >
              Heute
            </button>
            <div className="flex bg-light rounded-lg p-1">
              {(['week', 'month', 'quarter'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode ? 'bg-white shadow text-primary' : 'text-text-light hover:text-text'
                  }`}
                >
                  {mode === 'week' ? 'Woche' : mode === 'month' ? 'Monat' : 'Quartal'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Header - Date columns */}
        <div className="flex border-b border-border sticky top-0 bg-white z-10">
          <div className="w-64 shrink-0 p-3 border-r border-border font-semibold text-dark bg-slate-50">
            Projekt / Aufgabe
          </div>
          <div className="flex-1 flex">
            {dateRange.map((date, index) => {
              const isToday = isSameDay(date, new Date());
              const showDate = index === 0 || date.getDate() === 1 || (viewMode === 'week' && date.getDay() === 1);
              return (
                <div
                  key={date.toISOString()}
                  className={`flex-1 p-2 text-center text-xs border-r border-border/50 ${
                    isToday ? 'bg-primary/10' : date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-50' : ''
                  }`}
                  style={{ minWidth: viewMode === 'week' ? '60px' : viewMode === 'month' ? '30px' : '10px' }}
                >
                  {showDate && (
                    <>
                      <div className={`font-medium ${isToday ? 'text-primary' : 'text-text-light'}`}>
                        {format(date, 'd', { locale: de })}
                      </div>
                      {(index === 0 || date.getDate() === 1) && (
                        <div className="text-text-light/70 text-[10px]">
                          {format(date, 'MMM', { locale: de })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body - Projects and Tasks */}
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-text-light">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Lädt Projekte...
            </div>
          ) : projects && projects.length > 0 ? (
            projects.map((project: any) => {
              const projectTasks = getProjectTasks(project.id);
              const projectStart = project.createdAt ? new Date(project.createdAt) : null;
              const projectEnd = project.deadline ? new Date(project.deadline) : null;
              const projectBar = getBarPosition(projectStart, projectEnd);
              
              return (
                <div key={project.id}>
                  {/* Project Row */}
                  <div className="flex hover:bg-slate-50 transition-colors">
                    <div
                      className="w-64 shrink-0 p-3 border-r border-border cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="font-semibold text-dark truncate">{project.name}</div>
                      <div className="text-xs text-text-light flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                        {projectTasks.length} Aufgaben
                      </div>
                    </div>
                    <div className="flex-1 relative py-3">
                      {projectBar && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${getStatusColor(project.status)} opacity-80`}
                          style={{ left: `${projectBar.left}%`, width: `${projectBar.width}%`, minWidth: '8px' }}
                          title={`${project.name}: ${projectStart ? format(projectStart, 'dd.MM.yy') : '?'} - ${projectEnd ? format(projectEnd, 'dd.MM.yy') : '?'}`}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Task Rows */}
                  {projectTasks.map((task: any) => {
                    const taskStart = task.createdAt ? new Date(task.createdAt) : null;
                    const taskEnd = task.deadline ? new Date(task.deadline) : null;
                    const taskBar = getBarPosition(taskStart, taskEnd);
                    
                    return (
                      <div key={task.id} className="flex hover:bg-slate-50/50 transition-colors">
                        <div
                          className="w-64 shrink-0 p-3 pl-8 border-r border-border cursor-pointer"
                          onClick={() => router.push(`/tasks/${task.id}`)}
                        >
                          <div className="text-sm text-text truncate">↳ {task.title}</div>
                          <div className="text-xs text-text-light flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`} />
                            {task.status === 'DONE' ? 'Erledigt' : task.status === 'IN_PROGRESS' ? 'In Arbeit' : 'Offen'}
                          </div>
                        </div>
                        <div className="flex-1 relative py-3">
                          {taskBar && (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 h-4 rounded ${getStatusColor(task.status)} opacity-60`}
                              style={{ left: `${taskBar.left}%`, width: `${taskBar.width}%`, minWidth: '4px' }}
                              title={`${task.title}: ${taskStart ? format(taskStart, 'dd.MM.yy') : '?'} - ${taskEnd ? format(taskEnd, 'dd.MM.yy') : '?'}`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-text-light">
              <div className="text-4xl mb-2">📊</div>
              <p>Keine Projekte vorhanden</p>
              <button
                onClick={() => router.push('/projects/new')}
                className="mt-4 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Projekt erstellen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-text-light">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-500" /> Erledigt
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-500" /> In Arbeit
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500" /> Offen
        </div>
      </div>
    </div>
  );
}
