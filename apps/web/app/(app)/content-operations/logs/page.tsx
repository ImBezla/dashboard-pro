'use client';

import { useMemo, useState } from 'react';
import {
  CoFilterBar,
  CoLogRow,
  CoPagination,
  CoSearchInput,
  CoSectionHeader,
} from '@/components/content-ops/primitives';
import { mockLogs } from '@/lib/content-ops/mock-data';
import type { ActivityEntityType, ActivityLevel } from '@/lib/content-ops/types';

const levels: ActivityLevel[] = ['info', 'warning', 'error'];
const entities: ActivityEntityType[] = [
  'process',
  'account',
  'content',
  'job',
  'system',
];

const PAGE_SIZE = 4;

export default function CoLogsPage() {
  const [q, setQ] = useState('');
  const [level, setLevel] = useState<ActivityLevel | 'all'>('all');
  const [entity, setEntity] = useState<ActivityEntityType | 'all'>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockLogs.filter((l) => {
      if (level !== 'all' && l.level !== level) return false;
      if (entity !== 'all' && l.entityType !== entity) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        if (
          !l.message.toLowerCase().includes(needle) &&
          !l.entityId.toLowerCase().includes(needle)
        )
          return false;
      }
      return true;
    });
  }, [q, level, entity]);

  const total = filtered.length;
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chips = [
    {
      id: 'all-levels',
      label: 'Alle Level',
      active: level === 'all',
      onClick: () => {
        setPage(1);
        setLevel('all');
      },
    },
    ...levels.map((lv) => ({
      id: lv,
      label: lv,
      active: level === lv,
      onClick: () => {
        setPage(1);
        setLevel(lv);
      },
    })),
  ];

  const entityChips = [
    {
      id: 'all-entities',
      label: 'Alle Entitäten',
      active: entity === 'all',
      onClick: () => {
        setPage(1);
        setEntity('all');
      },
    },
    ...entities.map((e) => ({
      id: `ent-${e}`,
      label: e,
      active: entity === e,
      onClick: () => {
        setPage(1);
        setEntity(e);
      },
    })),
  ];

  return (
    <div className="space-y-4">
      <CoSectionHeader
        title="System-Logs"
        description="Durchsuchbare Operations-Spur (Mock, im Speicher)."
      />

      <CoFilterBar chips={chips}>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <CoSearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Nachricht oder Entitäts-ID…"
            className="sm:max-w-xs"
          />
        </div>
      </CoFilterBar>

      <CoFilterBar chips={entityChips} />

      <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/40 px-3 py-1">
        {slice.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500">Keine passenden Zeilen.</div>
        ) : (
          slice.map((l) => (
            <CoLogRow
              key={l.id}
              timestamp={l.timestamp}
              level={l.level}
              entityLabel={`${l.entityType}:${l.entityId}`}
              message={l.message}
            />
          ))
        )}
        <CoPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
