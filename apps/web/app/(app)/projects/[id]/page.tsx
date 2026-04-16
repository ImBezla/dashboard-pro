'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { TaskItem } from '@/components/dashboard/TaskItem';

type ProjectEditPayload = {
  name: string;
  description: string;
  status: string;
  deadline: string;
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectEditPayload) => {
      const response = await api.patch(`/projects/${projectId}`, data);
      return response.data;
    },
    onSuccess: (updatedProject) => {
      // Optimistically update the cache
      queryClient.setQueryData(['project', projectId], updatedProject);
      
          // Invalidate only necessary queries (they will refetch when needed)
          queryClient.invalidateQueries({ queryKey: ['project', projectId], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          
          setIsEditing(false);
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
      alert('Fehler beim Speichern des Projekts');
    },
  });

  if (isLoading) {
    return <div className="p-8">Lädt...</div>;
  }

  if (!project) {
    return <div className="p-8">Projekt nicht gefunden</div>;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const projectTasks = project.tasks || [];
  const completed = projectTasks.filter((t: any) => t.status === 'DONE').length;
  const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

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
          <h1 className="text-3xl font-black text-dark mb-2">{project.name}</h1>
          <p className="text-lg text-text-light">{project.description || 'Keine Beschreibung'}</p>
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
        <ProjectEditForm
          project={project}
          onSave={(data: ProjectEditPayload) => updateMutation.mutate(data)}
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
            <h3 className="text-xl font-bold mb-4">Projekt löschen?</h3>
            <p className="text-text-light mb-6">
              Möchten Sie das Projekt "{project.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
            <h2 className="text-xl font-bold text-dark mb-4">Aufgaben</h2>
            <div className="space-y-2">
              {projectTasks.length > 0 ? (
                projectTasks.map((task: any, index: number) => (
                  <div key={task.id} className="animate-slideIn" style={{ animationDelay: `${index * 0.05}s` }}>
                    <TaskItem 
                      task={{ ...task, projectId }} 
                      onUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                      }} 
                    />
                  </div>
                ))
              ) : (
                <p className="text-text-light">Keine Aufgaben vorhanden</p>
              )}
            </div>
            <button
              onClick={() => router.push(`/tasks/new?projectId=${projectId}`)}
              className="mt-4 text-primary hover:underline"
            >
              + Neue Aufgabe hinzufügen
            </button>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl p-6 shadow border border-border">
            <h3 className="text-lg font-bold text-dark mb-4">Projekt-Info</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-text-light mb-2">Status</div>
                <StatusSelect
                  currentStatus={project.status}
                  onStatusChange={async (newStatus) => {
                    try {
                      const response = await api.patch(`/projects/${projectId}`, { status: newStatus });
                      const updatedProject = response.data;
                      
                      // Optimistically update the cache
                      queryClient.setQueryData(['project', projectId], updatedProject);
                      
                      // Invalidate only necessary queries (they will refetch when needed)
                      queryClient.invalidateQueries({ queryKey: ['project', projectId], refetchType: 'none' });
                      queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'none' });
                      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
                      queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'none' });
                      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
                      queryClient.invalidateQueries({ queryKey: ['activities'] });
                    } catch (error) {
                      console.error('Failed to update project status:', error);
                      alert('Fehler beim Aktualisieren des Status');
                    }
                  }}
                />
              </div>
              {project.deadline && (
                <div>
                  <div className="text-sm text-text-light">Deadline</div>
                  <div className="font-semibold">
                    {new Date(project.deadline).toLocaleDateString('de-DE')}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-text-light">Fortschritt</div>
                <div className="w-full h-2 bg-border rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500 ease-out animate-progressBar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-sm text-text-light mt-1 animate-fadeIn">
                  {progress}% abgeschlossen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusSelect({ currentStatus, onStatusChange }: { currentStatus: string; onStatusChange: (status: string) => void }) {
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
    ACTIVE: 'bg-green-100 text-green-700 border-green-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-300',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    COMPLETED: 'bg-purple-100 text-purple-700 border-purple-300',
    ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isUpdating}
      className={`w-full px-4 py-2 border rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
        statusColors[status] || statusColors.PENDING
      } ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <option value="ACTIVE">Aktiv</option>
      <option value="IN_PROGRESS">In Bearbeitung</option>
      <option value="PENDING">Wartend</option>
      <option value="COMPLETED">Abgeschlossen</option>
      <option value="ARCHIVED">Archiviert</option>
    </select>
  );
}

function ProjectEditForm({
  project,
  onSave,
  onCancel,
  isSaving,
}: {
  project: { name: string; description?: string; status: string; deadline?: string };
  onSave: (data: ProjectEditPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <option value="ACTIVE">Aktiv</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="PENDING">Wartend</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="ARCHIVED">Archiviert</option>
            </select>
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

