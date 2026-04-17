'use client';

import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtDate } from '@/lib/operations-os/format';
import { OpsOsSection, OpsOsTaskStatus } from '@/components/operations-os/ui/ops-ui';

export function OpsOsProjectTasksClient({ projectId }: { projectId: string }) {
  const s = getOpsOsStore();
  const tasks = s.tasks.filter((t) => t.projectId === projectId);

  return (
    <div className="space-y-4">
      <OpsOsSection title="Tasks" description="Status und Fälligkeit (Mock)." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate text-zinc-200">{t.title}</div>
              {t.dueAt ? <div className="font-mono text-[10px] text-zinc-500">Fällig {fmtDate(t.dueAt)}</div> : null}
            </div>
            <OpsOsTaskStatus s={t.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
