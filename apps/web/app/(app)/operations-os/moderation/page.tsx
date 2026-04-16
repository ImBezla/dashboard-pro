import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtDate } from '@/lib/operations-os/format';
import { OpsOsSection, OpsOsTable } from '@/components/operations-os/ui/ops-ui';

export default function OperationsOsModerationPage() {
  const s = getOpsOsStore();

  return (
    <div className="space-y-4">
      <OpsOsSection
        title="Moderation"
        description="Policy- und Freigabe-Queue (Mock)."
      />
      <OpsOsTable
        rows={s.moderation}
        columns={[
          {
            id: 's',
            header: 'Vorgang',
            cell: (r) => <span className="text-sm text-zinc-200">{r.summary}</span>,
          },
          {
            id: 'st',
            header: 'Status',
            width: '110px',
            cell: (r) => (
              <span className="text-[10px] font-semibold uppercase text-zinc-400">{r.status}</span>
            ),
          },
          {
            id: 'p',
            header: 'Projekt',
            width: '180px',
            cell: (r) => (
              <Link
                href={`/operations-os/projects/${r.projectId}/overview`}
                className="text-xs text-sky-400 hover:underline"
              >
                {s.projects.find((p) => p.id === r.projectId)?.title ?? r.projectId}
              </Link>
            ),
          },
          {
            id: 'at',
            header: 'Erstellt',
            width: '140px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-500">{fmtDate(r.createdAt)}</span>
            ),
          },
        ]}
      />
    </div>
  );
}
