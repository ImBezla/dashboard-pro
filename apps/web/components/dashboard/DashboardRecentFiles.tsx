'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';

export function DashboardRecentFiles() {
  const { data: files, isLoading } = useQuery({
    queryKey: ['uploads-recent-dashboard'],
    queryFn: async () => {
      const r = await api.get('/uploads/list/recent', { params: { limit: 8 } });
      return (r.data || []) as {
        id: string;
        originalName: string;
        mimeType: string;
        size: number;
        createdAt: string;
        taskId?: string | null;
        projectId?: string | null;
      }[];
    },
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadFile = async (id: string, originalName: string) => {
    try {
      const res = await api.get(`/uploads/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // still list file; user can open from task/project
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="text-lg font-semibold text-dark">Letzte Dateien</div>
        <span className="text-xs text-text-light">Uploads</span>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !files?.length ? (
        <p className="text-sm text-text-light py-4 text-center">
          Noch keine Dateien hochgeladen.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[280px] overflow-y-auto">
          {files.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => downloadFile(f.id, f.originalName)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors text-left min-w-0"
              >
                <span className="text-lg shrink-0" aria-hidden>
                  📄
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-dark truncate">
                    {f.originalName}
                  </div>
                  <div className="text-xs text-text-light">
                    {formatSize(f.size)} · Herunterladen
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 pt-3 border-t border-border text-center">
        <Link
          href="/tasks"
          className="text-primary hover:text-primary-dark text-sm font-medium"
        >
          Zu Aufgaben & Projekten →
        </Link>
      </div>
    </div>
  );
}
