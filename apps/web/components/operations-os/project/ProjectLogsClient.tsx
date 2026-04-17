'use client';

import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtDate } from '@/lib/operations-os/format';
import { OpsOsLogLevel, OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsProjectLogsClient({ projectId }: { projectId: string }) {
  const s = getOpsOsStore();
  const flows = s.flows.filter((f) => f.projectId === projectId);
  const tasks = s.tasks.filter((t) => t.projectId === projectId);
  const docs = s.documents.filter((d) => d.projectId === projectId);
  const logs = s.logs
    .filter(
      (l) =>
        l.entityId === projectId ||
        flows.some((f) => f.id === l.entityId) ||
        tasks.some((t) => t.id === l.entityId) ||
        docs.some((d) => d.id === l.entityId),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4">
      <OpsOsSection title="Projekt-Logs" description="Gefilterte Aktivität (Mock)." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {logs.map((l) => (
          <li key={l.id} className="flex gap-3 px-3 py-2 text-sm">
            <OpsOsLogLevel level={l.level} />
            <div>
              <div className="text-zinc-200">{l.message}</div>
              <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                {l.entityType} · {fmtDate(l.timestamp)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
