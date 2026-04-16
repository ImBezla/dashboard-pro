'use client';

import { useMemo, useState } from 'react';
import { CoDrawer } from '@/components/content-ops/co-drawer';
import {
  CoDataTable,
  CoFilterBar,
  CoPriorityBadge,
  CoProcessStatusBadge,
  CoSectionHeader,
} from '@/components/content-ops/primitives';
import { mockProcesses } from '@/lib/content-ops/mock-data';
import type { ProcessItem, ProcessStatus } from '@/lib/content-ops/types';
import { formatDateTime, formatRelative } from '@/lib/content-ops/format';

const statuses: ProcessStatus[] = [
  'draft',
  'pending',
  'running',
  'blocked',
  'review',
  'done',
  'failed',
];

export default function CoProcessesPage() {
  const [filter, setFilter] = useState<ProcessStatus | 'all'>('all');
  const [selected, setSelected] = useState<ProcessItem | null>(null);

  const rows = useMemo(() => {
    if (filter === 'all') return mockProcesses;
    return mockProcesses.filter((p) => p.status === filter);
  }, [filter]);

  const chips = [
    { id: 'all', label: 'Alle', active: filter === 'all', onClick: () => setFilter('all') },
    ...statuses.map((s) => ({
      id: s,
      label: s,
      active: filter === s,
      onClick: () => setFilter(s),
    })),
  ];

  return (
    <div className="space-y-4">
      <CoSectionHeader
        title="Prozesse"
        description="Workflows mit Owner, Priorität und Abhängigkeiten."
      />
      <CoFilterBar chips={chips} />

      <CoDataTable
        rows={rows}
        onRowClick={setSelected}
        columns={[
          {
            id: 'title',
            header: 'Prozess',
            cell: (r) => (
              <div>
                <div className="font-medium text-zinc-100">{r.title}</div>
                {r.owner && <div className="text-xs text-zinc-500">{r.owner}</div>}
              </div>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            width: '110px',
            cell: (r) => <CoProcessStatusBadge status={r.status} />,
          },
          {
            id: 'priority',
            header: 'Priorität',
            width: '96px',
            cell: (r) => <CoPriorityBadge priority={r.priority} />,
          },
          {
            id: 'due',
            header: 'Fällig',
            width: '130px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-400">
                {r.dueAt ? formatDateTime(r.dueAt) : '—'}
              </span>
            ),
          },
          {
            id: 'updated',
            header: 'Aktualisiert',
            width: '120px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-400">
                {formatRelative(r.updatedAt)}
              </span>
            ),
          },
        ]}
      />

      <CoDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        subtitle={selected ? `ID ${selected.id}` : undefined}
        widthClassName="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <CoProcessStatusBadge status={selected.status} />
              <CoPriorityBadge priority={selected.priority} />
            </div>
            {selected.description && <p className="text-zinc-400">{selected.description}</p>}
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <dt className="text-zinc-500">Owner</dt>
              <dd className="text-zinc-200">{selected.owner ?? '—'}</dd>
              <dt className="text-zinc-500">Erstellt</dt>
              <dd className="font-mono text-zinc-200">{formatDateTime(selected.createdAt)}</dd>
              <dt className="text-zinc-500">Aktualisiert</dt>
              <dd className="font-mono text-zinc-200">{formatDateTime(selected.updatedAt)}</dd>
              <dt className="text-zinc-500">Nächster Schritt</dt>
              <dd className="text-zinc-200">{selected.nextStep ?? '—'}</dd>
            </dl>
            {selected.tags && selected.tags.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-500">Tags</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selected.dependencies && selected.dependencies.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-500">Abhängigkeiten</div>
                <ul className="mt-1 list-inside list-disc text-xs text-zinc-400">
                  {selected.dependencies.map((d) => (
                    <li key={d} className="font-mono">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CoDrawer>
    </div>
  );
}
