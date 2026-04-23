'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import api from '@/lib/api';
import { FieldSelect } from '@/components/ui/choice-controls';

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');

  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await api.get('/deals');
      return res.data as any[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', ''],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deals', {
        title: title.trim(),
        ...(customerId ? { customerId } : {}),
      });
      return res.data;
    },
    onSuccess: () => {
      setTitle('');
      setCustomerId('');
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  return (
    <div data-tour="page-deals">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Deals</h1>
          <p className="text-lg text-text-light">
            Meilenstein-basierte Pipeline mit Risiko-Übersicht.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow border border-border mb-8">
        <h2 className="font-bold text-dark mb-4">Neuer Deal</h2>
        <form
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createMutation.mutate();
          }}
        >
          <div className="flex-1">
            <label className="block text-sm text-text-light mb-1">Titel</label>
            <input
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-[15px] shadow-sm ring-1 ring-black/[0.03] transition-[border-color,box-shadow] placeholder:text-text-light focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 sm:text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Enterprise Rahmenvertrag"
            />
          </div>
          <div className="sm:w-56">
            <label className="block text-sm text-text-light mb-1">Kunde (optional)</label>
            <FieldSelect value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Kein Kunde</option>
              {(customers ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FieldSelect>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50"
          >
            Anlegen
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-border">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Lade Deals…
        </div>
      ) : !deals?.length ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-border text-text-light">
          Noch keine Deals — legen Sie oben einen an.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {deals.map((d: any) => (
            <Link
              key={d.id}
              href={`/deals/${d.id}`}
              className="block bg-white rounded-2xl p-6 shadow border border-border hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-lg text-dark">{d.title}</h3>
                <span className="text-xs font-semibold uppercase text-primary shrink-0">
                  {d.status}
                </span>
              </div>
              <p className="text-sm text-text-light mt-2">
                Risiko-Score:{' '}
                <span className="font-semibold text-dark">{d.riskScore}</span> ·
                Wsk. {d.probability}%
              </p>
              {d.customer && (
                <p className="text-sm text-text-light mt-1">Kunde: {d.customer.name}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
