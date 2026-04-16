'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { CommentSection } from '@/components/comments/CommentSection';
import { TagSelector } from '@/components/tags/TagSelector';
import { TimeTracker } from '@/components/timetracking/TimeTracker';
import { FileUpload } from '@/components/files/FileUpload';

type TaskEditPayload = {
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  projectId: string;
  assignedToId: string;
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.push('/tasks');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TaskEditPayload) => {
      const response = await api.patch(`/tasks/${taskId}`, data);
      return response.data;
    },
    onSuccess: (updatedTask) => {
      // Optimistically update the cache
      queryClient.setQueryData(['task', taskId], updatedTask);
      
      // Invalidate only necessary queries (they will refetch when needed)
      queryClient.invalidateQueries({ queryKey: ['task', taskId], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Only invalidate project if it changed
      if (updatedTask?.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', updatedTask.projectId], refetchType: 'none' });
      }
      
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      alert('Fehler beim Speichern der Aufgabe');
    },
  });

  if (isLoading) {
    return <div className="p-8">Lädt...</div>;
  }

  if (!task) {
    return <div className="p-8">Aufgabe nicht gefunden</div>;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="text-text-light hover:text-primary mb-2"
          >
            ← Zurück
          </button>
          <h1 className="text-3xl font-black text-dark mb-2">{task.title}</h1>
          <p className="text-lg text-text-light">{task.description || 'Keine Beschreibung'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            {isEditing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>

      {isEditing && (
        <TaskEditForm
          task={task}
          projects={projects}
          users={users}
          onSave={(data: TaskEditPayload) => updateMutation.mutate(data)}
          onCancel={() => {
            if (!updateMutation.isPending) {
              setIsEditing(false);
            }
          }}
          isSaving={updateMutation.isPending}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Aufgabe löschen?</h3>
            <p className="text-text-light mb-6">
              Möchten Sie die Aufgabe "{task.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-light mb-2">Status</div>
              <TaskStatusSelect
                currentStatus={task.status}
                onStatusChange={async (newStatus) => {
                  try {
                    const response = await api.patch(`/tasks/${taskId}`, { status: newStatus });
                    const updatedTask = response.data;
                    
                    // Optimistically update the cache
                    queryClient.setQueryData(['task', taskId], updatedTask);
                    
                        // Invalidate only necessary queries (they will refetch when needed)
                        queryClient.invalidateQueries({ queryKey: ['task', taskId], refetchType: 'none' });
                        queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
                        queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
                        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
                        queryClient.invalidateQueries({ queryKey: ['activities'] });
                        
                        // Only invalidate project if it exists
                        if (updatedTask?.projectId) {
                          queryClient.invalidateQueries({ queryKey: ['project', updatedTask.projectId], refetchType: 'none' });
                        }
                  } catch (error) {
                    console.error('Failed to update task status:', error);
                    alert('Fehler beim Aktualisieren des Status');
                  }
                }}
              />
            </div>
            <div>
              <div className="text-sm text-text-light mb-2">Priorität</div>
              {(() => {
                const priorityColors: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
                  HIGH: {
                    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
                    text: 'text-red-700',
                    border: 'border-red-200',
                    icon: '🔴',
                    label: 'Hoch',
                  },
                  MEDIUM: {
                    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
                    text: 'text-yellow-700',
                    border: 'border-yellow-200',
                    icon: '🟡',
                    label: 'Mittel',
                  },
                  LOW: {
                    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
                    text: 'text-green-700',
                    border: 'border-green-200',
                    icon: '🟢',
                    label: 'Niedrig',
                  },
                };
                const priority = priorityColors[task.priority] || priorityColors.MEDIUM;
                return (
                  <span
                    className={`px-4 py-2 ${priority.bg} ${priority.text} ${priority.border} border rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 w-fit`}
                  >
                    <span>{priority.icon}</span>
                    <span>{priority.label}</span>
                  </span>
                );
              })()}
            </div>
            {task.deadline && (
              <div>
                <div className="text-sm text-text-light mb-2">Deadline</div>
                <span className="px-4 py-2 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium flex items-center gap-2 w-fit">
                  <span>📅</span>
                  <span>{new Date(task.deadline).toLocaleDateString('de-DE')}</span>
                </span>
              </div>
            )}
            {task.project && (
              <div>
                <div className="text-sm text-text-light mb-2">Projekt</div>
                <span className="px-4 py-2 bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/20 rounded-lg text-sm font-medium flex items-center gap-2 w-fit">
                  <span>📁</span>
                  <span>{task.project.name}</span>
                  {task.project.teamName && (
                    <span className="text-xs opacity-70">• {task.project.teamName}</span>
                  )}
                </span>
              </div>
            )}
            {task.assignedTo && (
              <div>
                <div className="text-sm text-text-light mb-2">Zugewiesen an</div>
                <span className="px-4 py-2 bg-gradient-to-br from-slate-50 to-gray-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 w-fit">
                  <span>👤</span>
                  <span>{task.assignedTo.name}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar mit Tags, Zeit und Kommentaren */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CommentSection taskId={taskId} />
        </div>
        <div className="space-y-6">
          <TagSelector taskId={taskId} />
          <TimeTracker taskId={taskId} />
          <FileUpload taskId={taskId} />
        </div>
      </div>
    </div>
  );
}

function TaskStatusSelect({ currentStatus, onStatusChange }: { currentStatus: string; onStatusChange: (status: string) => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      setStatus(currentStatus); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-gray-100 text-gray-700 border-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-300',
    DONE: 'bg-green-100 text-green-700 border-green-300',
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isUpdating}
      className={`w-full px-4 py-2 border rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
        statusColors[status] || statusColors.OPEN
      } ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <option value="OPEN">Offen</option>
      <option value="IN_PROGRESS">In Bearbeitung</option>
      <option value="DONE">Erledigt</option>
    </select>
  );
}

function TaskEditForm({
  task,
  projects,
  users,
  onSave,
  onCancel,
  isSaving,
}: {
  task: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    deadline?: string;
    projectId?: string;
    assignedToId?: string;
  };
  projects: { id: string; name: string }[] | undefined;
  users: { id: string; name: string }[] | undefined;
  onSave: (data: TaskEditPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
    projectId: task.projectId || '',
    assignedToId: task.assignedToId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Titel</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Beschreibung</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="OPEN">Offen</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="DONE">Erledigt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Priorität</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="LOW">Niedrig</option>
              <option value="MEDIUM">Mittel</option>
              <option value="HIGH">Hoch</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Projekt</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Kein Projekt</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Zugewiesen an</label>
            <select
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Nicht zugewiesen</option>
              {users?.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Deadline</label>
          <input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Wird gespeichert...</span>
              </>
            ) : (
              'Speichern'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </form>
  );
}

