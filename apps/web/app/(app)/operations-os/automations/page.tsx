import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtDate } from '@/lib/operations-os/format';
import { OpsOsSection, OpsOsTable } from '@/components/operations-os/ui/ops-ui';

export default function OperationsOsAutomationsPage() {
  const s = getOpsOsStore();

  return (
    <div className="space-y-4">
      <OpsOsSection
        title="Automations"
        description="Hintergrundjobs und Integrationen (Mock-Status)."
      />
      <OpsOsTable
        rows={s.automations}
        columns={[
          { id: 'n', header: 'Job', cell: (r) => <span className="font-medium">{r.name}</span> },
          {
            id: 's',
            header: 'Status',
            width: '100px',
            cell: (r) => (
              <span className="text-[10px] font-semibold uppercase text-zinc-400">{r.status}</span>
            ),
          },
          {
            id: 'lr',
            header: 'Letzter Lauf',
            width: '150px',
            cell: (r) => (
              <span className="font-mono text-xs text-zinc-500">
                {r.lastRunAt ? fmtDate(r.lastRunAt) : '—'}
              </span>
            ),
          },
          {
            id: 'p',
            header: 'Projekt',
            cell: (r) => (
              <Link
                href={`/operations-os/projects/${r.projectId}/overview`}
                className="text-xs text-sky-400 hover:underline"
              >
                {s.projects.find((p) => p.id === r.projectId)?.title ?? r.projectId}
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
