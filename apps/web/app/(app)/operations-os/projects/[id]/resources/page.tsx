import { notFound } from 'next/navigation';
import { getOpsOsStore, opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsSection, OpsOsTable } from '@/components/operations-os/ui/ops-ui';

export default function OperationsOsProjectResourcesPage({ params }: { params: { id: string } }) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  const s = getOpsOsStore();
  const rows = s.resources.filter((r) => r.projectId === p.id);

  return (
    <div className="space-y-4">
      <OpsOsSection
        title="Ressourcen"
        description="Externe Links, Tools, Referenzen und Platzhalter für Dateien."
      />
      <OpsOsTable
        rows={rows}
        columns={[
          { id: 't', header: 'Titel', cell: (r) => <span className="font-medium">{r.title}</span> },
          {
            id: 'k',
            header: 'Art',
            width: '100px',
            cell: (r) => <span className="text-xs text-zinc-500">{r.kind}</span>,
          },
          {
            id: 'h',
            header: 'Link / Pfad',
            cell: (r) => (
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-xs text-sky-400 hover:underline"
              >
                {r.href}
              </a>
            ),
          },
        ]}
      />
    </div>
  );
}
