'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, DragEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { TaskItem } from '@/components/dashboard/TaskItem';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type ViewMode = 'list' | 'kanban';
type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  OPEN: { label: 'Offen', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'In Bearbeitung', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  DONE: { label: 'Erledigt', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
};

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'deadline' | 'priority' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Read tag filter from URL
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    setTagFilter(tagParam);
  }, [searchParams]);

  const { data: tasks, refetch, isLoading, error } = useQuery({
    queryKey: ['tasks', filter, priorityFilter, searchQuery, sortBy, sortOrder],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filter !== 'all') params.append('status', filter === 'in_progress' ? 'IN_PROGRESS' : filter.toUpperCase());
        if (priorityFilter !== 'all') params.append('priority', priorityFilter.toUpperCase());
        if (searchQuery) params.append('search', searchQuery);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        const response = await api.get(`/tasks?${params.toString()}`);
        return response.data;
      } catch (err: any) {
        console.error('Tasks API error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return [];
        }
        return [];
      }
    },
    retry: 1,
  });

  // Load tags for all tasks to enable filtering
  const { data: taskTags } = useQuery({
    queryKey: ['task-tags-map'],
    queryFn: async () => {
      if (!tasks || tasks.length === 0) return {};
      
      const tagMap: Record<string, any[]> = {};
      
      await Promise.all(
        tasks.map(async (task: any) => {
          try {
            const response = await api.get(`/tags/task/${task.id}`);
            tagMap[task.id] = response.data || [];
          } catch {
            tagMap[task.id] = [];
          }
        })
      );
      
      return tagMap;
    },
    enabled: !!tasks && tasks.length > 0,
  });

  // Filter tasks by tag if tag filter is active
  const filteredTasks = tagFilter && taskTags
    ? tasks?.filter((task: any) => {
        const tags = taskTags[task.id] || [];
        return tags.some((t: any) => t.name.toLowerCase() === tagFilter.toLowerCase());
      })
    : tasks;

  const clearTagFilter = () => {
    setTagFilter(null);
    router.push('/tasks');
  };

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      await api.patch(`/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTaskId(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      await api.post('/tasks/bulk-delete', { taskIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTasks([]);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ taskIds, data }: { taskIds: string[]; data: any }) => {
      await api.post('/tasks/bulk-update', { taskIds, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTasks([]);
    },
  });

  const handleDelete = (taskId: string) => {
    deleteMutation.mutate(taskId);
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length > 0) {
      bulkDeleteMutation.mutate(selectedTasks);
    }
  };

  const handleBulkStatusChange = (status: string) => {
    if (selectedTasks.length > 0) {
      bulkUpdateMutation.mutate({ taskIds: selectedTasks, data: { status } });
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === filteredTasks?.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks?.map((t: any) => t.id) || []);
    }
  };

  // Kanban Drag & Drop
  const handleDragStart = (e: DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask) {
      updateTaskMutation.mutate({ taskId: draggedTask, status });
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks?.filter((t: any) => t.status === status) || [];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Aufgaben</h1>
          <p className="text-lg text-text-light">
            Verwalten Sie alle Aufgaben und To-Dos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-light rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-text-light hover:text-text'
              }`}
            >
              ☰ Liste
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white shadow text-primary' : 'text-text-light hover:text-text'
              }`}
            >
              ▦ Kanban
            </button>
          </div>
          <button
            onClick={() => router.push('/tasks/new')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            + Neue Aufgabe
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Aufgaben durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 max-w-md px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="createdAt">Erstellt</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priorität</option>
                <option value="title">Titel</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-border rounded-lg hover:bg-light transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-text-light self-center mr-2">Status:</span>
              {(['all', 'open', 'in_progress', 'done'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    filter === f
                      ? 'bg-primary text-white'
                      : 'bg-white text-text hover:bg-light'
                  }`}
                >
                  {f === 'all' && 'Alle'}
                  {f === 'open' && 'Offen'}
                  {f === 'in_progress' && 'In Bearbeitung'}
                  {f === 'done' && 'Erledigt'}
                </button>
              ))}
              <span className="text-sm text-text-light self-center mx-2">Priorität:</span>
              {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    priorityFilter === p
                      ? 'bg-primary text-white'
                      : 'bg-white text-text hover:bg-light'
                  }`}
                >
                  {p === 'all' && 'Alle'}
                  {p === 'high' && 'Hoch'}
                  {p === 'medium' && 'Mittel'}
                  {p === 'low' && 'Niedrig'}
                </button>
              ))}
            </div>

            {/* Tag Filter Banner */}
            {tagFilter && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏷️</span>
                  <div>
                    <span className="text-indigo-700 font-semibold">
                      Gefiltert nach Tag: 
                    </span>
                    <span className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
                      {tagFilter}
                    </span>
                  </div>
                  <span className="text-indigo-600 text-sm">
                    ({filteredTasks?.length || 0} Aufgabe{filteredTasks?.length !== 1 ? 'n' : ''})
                  </span>
                </div>
                <button
                  onClick={clearTagFilter}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-1"
                >
                  ✕ Filter entfernen
                </button>
              </div>
            )}

            {selectedTasks.length > 0 && (
              <div className="bg-primary/10 border border-primary rounded-lg p-4 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-primary">
                    {selectedTasks.length} Aufgabe{selectedTasks.length > 1 ? 'n' : ''} ausgewählt
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-primary hover:text-primary-dark text-sm font-semibold"
                  >
                    {selectedTasks.length === filteredTasks?.length ? 'Alle abwählen' : 'Alle auswählen'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => handleBulkStatusChange(e.target.value)}
                    className="px-3 py-1 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Status ändern...</option>
                    <option value="OPEN">Offen</option>
                    <option value="IN_PROGRESS">In Bearbeitung</option>
                    <option value="DONE">Erledigt</option>
                  </select>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="bg-danger text-white px-4 py-1 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {bulkDeleteMutation.isPending ? 'Löscht...' : 'Löschen'}
                  </button>
                  <button
                    onClick={() => setSelectedTasks([])}
                    className="bg-white border border-border text-text px-4 py-1 rounded-lg text-sm font-semibold hover:bg-light transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow border border-border">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-text-light animate-pulse">Lädt Aufgaben...</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow border border-border">
              <div className="text-center">
                <div className="text-red-600 mb-4">Fehler beim Laden der Aufgaben</div>
                <button
                  onClick={() => refetch()}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Erneut versuchen
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow border border-border">
              {filteredTasks && filteredTasks.length > 0 ? (
                filteredTasks.map((task: any, index: number) => (
                  <div key={task.id} className="relative group animate-slideIn" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex items-center gap-3 px-6 py-2 border-b border-border">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <TaskItem task={task} onUpdate={refetch} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTaskId(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-danger hover:text-red-700 transition-opacity px-2"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-text-light">
                  <div className="text-4xl mb-4">{tagFilter ? '🏷️' : '✅'}</div>
                  <p className="text-lg font-semibold mb-2">
                    {tagFilter ? `Keine Aufgaben mit Tag "${tagFilter}"` : 'Keine Aufgaben gefunden'}
                  </p>
                  <p className="text-sm">
                    {tagFilter 
                      ? 'Weisen Sie Aufgaben diesen Tag zu oder entfernen Sie den Filter'
                      : 'Erstellen Sie Ihre erste Aufgabe, um zu beginnen'
                    }
                  </p>
                  {tagFilter && (
                    <button
                      onClick={clearTagFilter}
                      className="mt-4 text-primary hover:text-primary-dark font-semibold"
                    >
                      Filter entfernen
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['OPEN', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((status) => (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              className={`rounded-xl border-2 ${STATUS_CONFIG[status].bgColor} p-4 min-h-[500px] transition-colors ${
                draggedTask ? 'border-dashed' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${STATUS_CONFIG[status].color}`}>
                  {STATUS_CONFIG[status].label}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[status].color} bg-white`}>
                  {getTasksByStatus(status).length}
                </span>
              </div>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-text-light">Lädt...</div>
                ) : getTasksByStatus(status).length > 0 ? (
                  getTasksByStatus(status).map((task: any) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className={`bg-white rounded-lg p-4 shadow-sm border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                        draggedTask === task.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-dark text-sm line-clamp-2">{task.title}</h4>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'HIGH' ? 'Hoch' : task.priority === 'MEDIUM' ? 'Mittel' : 'Niedrig'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-text-light line-clamp-2 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-text-light">
                        {task.deadline && (
                          <span className={task.deadline < new Date().toISOString() && status !== 'DONE' ? 'text-red-600' : ''}>
                            📅 {format(new Date(task.deadline), 'dd.MM.yy', { locale: de })}
                          </span>
                        )}
                        {task.project && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded truncate max-w-[100px]">
                            {task.project.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-text-light text-sm border-2 border-dashed border-border/50 rounded-lg">
                    Keine Aufgaben
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Aufgabe löschen?</h3>
            <p className="text-text-light mb-6">
              Möchten Sie diese Aufgabe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(deleteTaskId)}
                disabled={deleteMutation.isPending}
                className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </button>
              <button
                onClick={() => setDeleteTaskId(null)}
                className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-light">Lädt...</div>}>
      <TasksPageContent />
    </Suspense>
  );
}
