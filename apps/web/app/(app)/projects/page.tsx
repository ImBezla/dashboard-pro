'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ProjectCard } from '@/components/dashboard/ProjectCard';

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const { data: projects, refetch, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await api.get('/projects');
        return response.data;
      } catch (err: any) {
        console.error('Projects API error:', err);
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

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteProjectId(null);
    },
  });

  const filteredProjects = projects?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (projectId: string) => {
    deleteMutation.mutate(projectId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Projekte</h1>
          <p className="text-lg text-text-light">
            Verwalten Sie alle Ihre Projekte
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/projects/gantt')}
            className="flex items-center gap-2 bg-white border border-border text-text px-4 py-3 rounded-xl font-semibold hover:bg-light transition-colors"
          >
            📊 Gantt-Chart
          </button>
          <button
            onClick={() => router.push('/projects/new')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            + Neues Projekt
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Projekte durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-text-light animate-pulse">Lädt Projekte...</div>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-4">Fehler beim Laden der Projekte</div>
            <button
              onClick={() => refetch()}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
          {filteredProjects && filteredProjects.length > 0 ? (
            filteredProjects.map((project: any) => {
          const projectTasks = project.tasks || [];
          const completed = projectTasks.filter((t: any) => t.status === 'DONE').length;
          const progress =
            projectTasks.length > 0
              ? Math.round((completed / projectTasks.length) * 100)
              : 0;

          return (
            <div
              key={project.id}
              className="relative group cursor-pointer min-w-0"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <ProjectCard
                project={{
                  id: project.id,
                  name: project.name,
                  status: project.status,
                  progress,
                  deadline: project.deadline,
                  tasksCount: projectTasks.length,
                  completedTasks: completed,
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteProjectId(project.id);
                }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-danger text-white p-2 rounded-lg hover:bg-red-600 transition-opacity"
              >
                🗑️
              </button>
            </div>
          );
        })
          ) : (
            <div className="col-span-full text-center text-text-light py-8 sm:py-12 min-w-0">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-base sm:text-lg font-semibold mb-2">Keine Projekte</p>
              <p className="text-sm break-words px-4">Erstellen Sie ein Projekt, um zu beginnen</p>
            </div>
          )}
        </div>
      )}

      {deleteProjectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full min-w-0">
            <h3 className="text-lg sm:text-xl font-bold mb-4 truncate">Projekt löschen?</h3>
            <p className="text-text-light mb-6">
              Möchten Sie dieses Projekt wirklich löschen? Alle zugehörigen Aufgaben werden ebenfalls gelöscht.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(deleteProjectId)}
                disabled={deleteMutation.isPending}
                className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </button>
              <button
                onClick={() => setDeleteProjectId(null)}
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

