'use client';

import { useMemo, useState } from 'react';
import {
  CoDataTable,
  CoFilterBar,
  CoModerationStatusBadge,
  CoSectionHeader,
} from '@/components/content-ops/primitives';
import { mockAccounts, mockModeration } from '@/lib/content-ops/mock-data';
import type { ModerationStatus } from '@/lib/content-ops/types';
import { formatDateTime } from '@/lib/content-ops/format';

const statuses: ModerationStatus[] = ['open', 'reviewing', 'resolved', 'flagged'];

export default function CoModerationPage() {
  const [filter, setFilter] = useState<ModerationStatus | 'all'>('all');

  const rows = useMemo(() => {
    if (filter === 'all') return mockModeration;
    return mockModeration.filter((m) => m.status === filter);
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
        title="Moderation"
        description="Kommentare und DMs für Brand Safety und SLAs."
      />
      <CoFilterBar chips={chips} />

      <CoDataTable
        rows={rows}
        columns={[
          {
            id: 'type',
            header: 'Typ',
            width: '88px',
            cell: (r) => (
              <span className="text-xs uppercase text-zinc-500">{r.type}</span>
            ),
          },
          {
            id: 'content',
            header: 'Inhalt',
            cell: (r) => (
              <span className="line-clamp-2 text-zinc-200" title={r.content}>
                {r.content}
              </span>
            ),
          },
          {
            id: 'account',
            header: 'Konto',
            width: '130px',
            cell: (r) => (
              <span className="text-xs text-zinc-400">
                {mockAccounts.find((a) => a.id === r.accountId)?.name ?? r.accountId}
              </span>
            ),
          },
          {
            id: 'author',
            header: 'Autor',
            width: '120px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-500">{r.author}</span>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            width: '110px',
            cell: (r) => <CoModerationStatusBadge status={r.status} />,
          },
          {
            id: 'created',
            header: 'Erstellt',
            width: '130px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-400">
                {formatDateTime(r.createdAt)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
