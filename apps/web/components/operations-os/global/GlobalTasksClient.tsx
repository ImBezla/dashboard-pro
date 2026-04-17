'use client';

import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { OpsOsSection, OpsOsTaskStatus } from '@/components/operations-os/ui/ops-ui';

export function OpsOsGlobalTasksClient() {
  const s = getOpsOsStore();
  const tasks = [...s.tasks];

  return (
    <div className="space-y-4">
      <OpsOsSection title="Alle Tasks" description="Querschnitt über Projekte (Mock)." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate text-zinc-200">{t.title}</div>
              <Link
                href={`/operations-os/projects/${t.projectId}/tasks`}
                className="text-[10px] text-sky-400 hover:underline"
              >
                Projekt-Tasks
              </Link>
            </div>
            <OpsOsTaskStatus s={t.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
