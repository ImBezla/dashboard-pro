'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { FieldSelect } from '@/components/ui/choice-controls';

export default function DealRoomPage() {
  const params = useParams();
  const id = String(params.id ?? '');
  const queryClient = useQueryClient();
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [projectIdToLink, setProjectIdToLink] = useState('');

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const res = await api.get(`/deals/${encodeURIComponent(id)}`);
      return res.data as any;
    },
    enabled: Boolean(id),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data as any[];
    },
  });

  const addMilestone = useMutation({
    mutationFn: async () => {
      await api.post(`/deals/${encodeURIComponent(id)}/milestones`, {
        title: milestoneTitle.trim(),
      });
    },
    onSuccess: () => {
      setMilestoneTitle('');
      void queryClient.invalidateQueries({ queryKey: ['deal', id] });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
      void queryClient.invalidateQueries({ queryKey: ['command-feed'] });
    },
  });

  const patchMilestone = useMutation({
    mutationFn: async ({
      milestoneId,
      status,
    }: {
      milestoneId: string;
      status: string;
    }) => {
      await api.patch(
        `/deals/${encodeURIComponent(id)}/milestones/${encodeURIComponent(milestoneId)}`,
        { status },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deal', id] });
      void queryClient.invalidateQueries({ queryKey: ['command-feed'] });
    },
  });

  const linkProject = useMutation({
    mutationFn: async () => {
      await api.post(
        `/deals/${encodeURIComponent(id)}/projects/${encodeURIComponent(projectIdToLink)}`,
      );
    },
    onSuccess: () => {
      setProjectIdToLink('');
      void queryClient.invalidateQueries({ queryKey: ['deal', id] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  if (!id) return null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/deals"
          className="text-sm text-primary font-semibold hover:underline"
        >
          ← Alle Deals
        </Link>
      </div>

      {isLoading || !deal ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-border">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Lade Deal…
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-dark mb-2">{deal.title}</h1>
            <p className="text-text-light">
              Status: <strong>{deal.status}</strong> · Risiko-Score:{' '}
              <strong>{deal.riskScore}</strong> · Wahrscheinlichkeit:{' '}
              <strong>{deal.probability}%</strong>
            </p>
            {deal.description && (
              <p className="mt-4 text-text-light whitespace-pre-wrap">{deal.description}</p>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="bg-white rounded-2xl p-6 shadow border border-border">
              <h2 className="font-bold text-dark mb-4">Meilensteine</h2>
              <form
                className="flex gap-2 mb-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!milestoneTitle.trim()) return;
                  addMilestone.mutate();
                }}
              >
                <input
                  className="flex-1 px-3 py-2 border border-border rounded-xl text-sm"
                  placeholder="Neuer Meilenstein"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={addMilestone.isPending}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
                >
                  +
                </button>
              </form>
              <ul className="space-y-3">
                {(deal.milestones ?? []).map((m: any) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 border border-border rounded-xl p-3"
                  >
                    <div>
                      <p className="font-medium text-dark">{m.title}</p>
                      <p className="text-xs text-text-light">
                        {m.status}
                        {m.dueDate &&
                          ` · Fällig ${new Date(m.dueDate).toLocaleDateString('de-DE')}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {m.status !== 'DONE' && (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white"
                          onClick={() =>
                            patchMilestone.mutate({ milestoneId: m.id, status: 'DONE' })
                          }
                        >
                          Erledigt
                        </button>
                      )}
                      {m.status !== 'BLOCKED' && (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-lg bg-amber-500 text-white"
                          onClick={() =>
                            patchMilestone.mutate({ milestoneId: m.id, status: 'BLOCKED' })
                          }
                        >
                          Blockiert
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow border border-border">
                <h2 className="font-bold text-dark mb-4">Projekte verknüpfen</h2>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!projectIdToLink) return;
                    linkProject.mutate();
                  }}
                >
                  <FieldSelect value={projectIdToLink} onChange={(e) => setProjectIdToLink(e.target.value)}>
                    <option value="">Projekt wählen…</option>
                    {(projects ?? [])
                      .filter((p: any) => !p.dealId || p.dealId === id)
                      .map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </FieldSelect>
                  <button
                    type="submit"
                    disabled={linkProject.isPending || !projectIdToLink}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Mit Deal verknüpfen
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow border border-border">
                <h2 className="font-bold text-dark mb-3">Verknüpfte Projekte</h2>
                <ul className="space-y-2 text-sm">
                  {(deal.projects ?? []).length === 0 ? (
                    <li className="text-text-light">Keine Projekte verknüpft.</li>
                  ) : (
                    (deal.projects ?? []).map((p: any) => (
                      <li key={p.id}>
                        <Link className="text-primary font-medium" href={`/projects/${p.id}`}>
                          {p.name}
                        </Link>{' '}
                        <span className="text-text-light">({p.status})</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow border border-border">
                <h2 className="font-bold text-dark mb-3">Rechnungen</h2>
                <ul className="space-y-2 text-sm">
                  {(deal.invoices ?? []).length === 0 ? (
                    <li className="text-text-light">Keine Rechnungen verknüpft.</li>
                  ) : (
                    (deal.invoices ?? []).map((inv: any) => (
                      <li key={inv.id}>
                        <Link className="text-primary font-medium" href={`/invoices/${inv.id}`}>
                          {inv.invoiceNumber}
                        </Link>{' '}
                        <span className="text-text-light">
                          {inv.amount} € · {inv.status}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
