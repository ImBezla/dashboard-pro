'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type CommandItem = {
  id: string;
  title: string;
  summary: string;
  severity: number;
  dueAt: string | null;
  entityType: string;
  entityId: string;
  suggestedActions: Array<{
    key: string;
    label: string;
    api: {
      method: string;
      pathTemplate: string;
      body?: Record<string, unknown>;
    };
  }>;
};

function resolvePath(template: string, entityId: string): string {
  return template.replace(':id', encodeURIComponent(entityId));
}

export default function CommandFeedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['command-feed'],
    queryFn: async () => {
      const res = await api.get<{ items: CommandItem[] }>('/command-feed');
      return res.data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      method,
      path,
      body,
    }: {
      method: string;
      path: string;
      body?: Record<string, unknown>;
    }) => {
      if (method === 'PATCH') {
        return api.patch(path, body ?? {});
      }
      if (method === 'POST') {
        return api.post(path, body ?? {});
      }
      throw new Error(`Unsupported method: ${method}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['command-feed'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const items = data?.items ?? [];

  return (
    <div data-tour="page-command-feed">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-dark mb-2">Command Feed</h1>
        <p className="text-lg text-text-light">
          Priorisierte Entscheidungen: überfällige Aufgaben, offene Zahlungen,
          Deals mit Risiko.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 shadow border border-border text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-light">Lade Command Feed…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6">
          Command Feed konnte nicht geladen werden.
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow border border-border text-center">
          <p className="text-text-light text-lg">
            Aktuell nichts Entscheidungsrelevantes — gute Arbeit.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="bg-white rounded-2xl p-6 shadow border border-border"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Priorität {item.severity} · {item.entityType}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-dark">{item.title}</h2>
                  <p className="text-text-light mt-1">{item.summary}</p>
                  {item.dueAt && (
                    <p className="text-sm text-text-light mt-2">
                      Fällig / Bezug:{' '}
                      {new Date(item.dueAt).toLocaleString('de-DE')}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.suggestedActions.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      disabled={actionMutation.isPending}
                      onClick={() => {
                        if (a.api.method === 'GET') {
                          const path = resolvePath(a.api.pathTemplate, item.entityId);
                          if (path.startsWith('/deals/')) {
                            router.push(path);
                          }
                          return;
                        }
                        const path = resolvePath(a.api.pathTemplate, item.entityId);
                        actionMutation.mutate({
                          method: a.api.method,
                          path,
                          body: a.api.body,
                        });
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
