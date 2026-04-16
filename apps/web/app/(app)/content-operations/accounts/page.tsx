'use client';

import { useMemo, useState } from 'react';
import { CoDrawer } from '@/components/content-ops/co-drawer';
import {
  CoAccountHealthIndicator,
  CoAccountStatusBadge,
  CoDataTable,
  CoFilterBar,
  CoSectionHeader,
} from '@/components/content-ops/primitives';
import { mockAccounts } from '@/lib/content-ops/mock-data';
import type { AccountStatus, InstaAccount } from '@/lib/content-ops/types';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/content-ops/format';

const statuses: AccountStatus[] = ['active', 'warning', 'paused', 'restricted'];

export default function CoAccountsPage() {
  const [filter, setFilter] = useState<AccountStatus | 'all'>('all');
  const [selected, setSelected] = useState<InstaAccount | null>(null);

  const rows = useMemo(() => {
    if (filter === 'all') return mockAccounts;
    return mockAccounts.filter((a) => a.status === filter);
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
        title="Instagram-Konten"
        description="Nische, Reichweite, Engagement und Health-Score."
      />
      <CoFilterBar chips={chips} />

      <CoDataTable
        rows={rows}
        onRowClick={setSelected}
        columns={[
          {
            id: 'name',
            header: 'Account',
            cell: (r) => (
              <div>
                <div className="font-medium text-zinc-100">{r.name}</div>
                <div className="text-xs text-zinc-500">{r.niche}</div>
              </div>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            width: '110px',
            cell: (r) => <CoAccountStatusBadge status={r.status} />,
          },
          {
            id: 'health',
            header: 'Health',
            width: '130px',
            cell: (r) => <CoAccountHealthIndicator score={r.healthScore} />,
          },
          {
            id: 'followers',
            header: 'Follower',
            width: '100px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-400">
                {r.followers != null ? formatNumber(r.followers) : '—'}
              </span>
            ),
          },
          {
            id: 'er',
            header: 'ER',
            width: '72px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-400">
                {r.engagementRate != null ? formatPercent(r.engagementRate) : '—'}
              </span>
            ),
          },
          {
            id: 'last',
            header: 'Letzter Post',
            width: '130px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-400">
                {r.lastPostAt ? formatDateTime(r.lastPostAt) : '—'}
              </span>
            ),
          },
        ]}
      />

      <CoDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? `${selected.niche} · ${selected.id}` : undefined}
        widthClassName="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <CoAccountStatusBadge status={selected.status} />
              <span className="text-xs text-zinc-400">Plattform: Instagram</span>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <dt className="text-zinc-500">Health</dt>
              <dd>
                <CoAccountHealthIndicator score={selected.healthScore} />
              </dd>
              <dt className="text-zinc-500">Follower</dt>
              <dd className="font-mono text-zinc-200">
                {selected.followers != null ? formatNumber(selected.followers) : '—'}
              </dd>
              <dt className="text-zinc-500">Engagement</dt>
              <dd className="font-mono text-zinc-200">
                {selected.engagementRate != null
                  ? formatPercent(selected.engagementRate)
                  : '—'}
              </dd>
              <dt className="text-zinc-500">Letzter Post</dt>
              <dd className="font-mono text-zinc-200">
                {selected.lastPostAt ? formatDateTime(selected.lastPostAt) : '—'}
              </dd>
            </dl>
            <p className="text-xs text-zinc-500">
              Mock-Detailpanel — in Produktion an euren Account-Store anbinden.
            </p>
          </div>
        )}
      </CoDrawer>
    </div>
  );
}
