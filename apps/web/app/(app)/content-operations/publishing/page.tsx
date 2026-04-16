import {
  CoContentStageBadge,
  CoDataTable,
  CoSectionHeader,
} from '@/components/content-ops/primitives';
import { mockAccounts, mockContent } from '@/lib/content-ops/mock-data';
import { formatDateTime } from '@/lib/content-ops/format';

export default function CoPublishingPage() {
  const queue = mockContent.filter(
    (c) => c.stage === 'scheduled' || c.stage === 'approved',
  );

  return (
    <div className="space-y-4">
      <CoSectionHeader
        title="Publishing-Warteschlange"
        description="Freigegebene oder geplante Instagram-Auslieferungen."
      />
      <CoDataTable
        rows={queue}
        emptyMessage="Keine Einträge in approved / scheduled."
        columns={[
          {
            id: 'title',
            header: 'Content',
            cell: (r) => (
              <div>
                <div className="font-medium text-zinc-100">{r.title}</div>
                <div className="text-xs text-zinc-500">
                  {mockAccounts.find((a) => a.id === r.accountId)?.name ?? r.accountId}
                </div>
              </div>
            ),
          },
          {
            id: 'format',
            header: 'Format',
            width: '88px',
            cell: (r) => (
              <span className="text-xs uppercase text-zinc-500">{r.format}</span>
            ),
          },
          {
            id: 'stage',
            header: 'Stufe',
            width: '120px',
            cell: (r) => <CoContentStageBadge stage={r.stage} />,
          },
          {
            id: 'when',
            header: 'Geplant',
            width: '150px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-400">
                {r.scheduledAt ? formatDateTime(r.scheduledAt) : '—'}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
