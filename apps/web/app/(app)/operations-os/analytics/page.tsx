import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import type { ProjectStatus } from '@/lib/operations-os/types';
import { OpsOsKpi, OpsOsSection } from '@/components/operations-os/ui/ops-ui';

function Bars({ data }: { data: { label: string; value: number; max: number }[] }) {
  return (
    <div className="flex flex-col justify-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-xs">
          <span className="w-28 shrink-0 truncate text-zinc-500">{d.label}</span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded bg-zinc-800">
            <div
              className="h-full rounded bg-sky-500/60"
              style={{ width: `${(d.value / d.max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-mono text-zinc-400">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function OperationsOsAnalyticsPage() {
  const s = getOpsOsStore();
  const done = s.tasks.filter((t) => t.status === 'done').length;
  const totalT = s.tasks.length;
  const statusKeys: ProjectStatus[] = ['active', 'planning', 'blocked', 'review', 'idea'];
  const byStatus = statusKeys.map((st) => ({
    label: st,
    value: s.projects.filter((p) => p.status === st).length,
    max: Math.max(1, s.projects.length),
  }));

  return (
    <div className="space-y-6">
      <OpsOsSection
        title="Analytics"
        description="Aggregierte Kennzahlen aus dem Mock-Store — später an BI anbinden."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OpsOsKpi label="Projekte" value={String(s.projects.length)} />
        <OpsOsKpi label="Flows" value={String(s.flows.length)} />
        <OpsOsKpi label="Nodes" value={String(s.nodes.length)} />
        <OpsOsKpi
          label="Task-Erledigung"
          value={`${totalT ? Math.round((done / totalT) * 100) : 0}%`}
          hint={`${done} / ${totalT}`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Projekte nach Status</h3>
          <div className="mt-4">
            <Bars data={byStatus} />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Dokumente pro Projekt (Top 5)</h3>
          <div className="mt-4">
            <Bars
              data={[...s.projects]
                .map((p) => ({
                  label: p.title.slice(0, 18) + (p.title.length > 18 ? '…' : ''),
                  value: s.documents.filter((d) => d.projectId === p.id).length,
                  max: Math.max(
                    1,
                    ...s.projects.map((x) => s.documents.filter((d) => d.projectId === x.id).length),
                  ),
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
