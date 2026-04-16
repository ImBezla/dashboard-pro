import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtDate } from '@/lib/operations-os/format';
import { OpsOsSection, OpsOsTable } from '@/components/operations-os/ui/ops-ui';

export default function OperationsOsPublishingPage() {
  const s = getOpsOsStore();
  const rows = [...s.publishing].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <OpsOsSection
        title="Publishing"
        description="Geplante und veröffentlichte Artefakte (Mock) — verknüpft mit Projekten."
      />
      <OpsOsTable
        rows={rows}
        columns={[
          {
            id: 't',
            header: 'Titel',
            cell: (r) => <span className="font-medium text-zinc-100">{r.title}</span>,
          },
          {
            id: 'ch',
            header: 'Kanal',
            width: '100px',
            cell: (r) => <span className="text-xs text-zinc-500">{r.channel}</span>,
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
            width: '160px',
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
            header: 'Geplant',
            width: '140px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-500">{fmtDate(r.scheduledAt)}</span>
            ),
          },
        ]}
      />
    </div>
  );
}
