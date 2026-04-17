'use client';

import { opsNotesForProject } from '@/lib/operations-os/seed-mock';
import { OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsProjectNotesClient({ projectId }: { projectId: string }) {
  const notes = opsNotesForProject(projectId);

  return (
    <div className="space-y-4">
      <OpsOsSection title="Notizen" description="Kurznotizen und Cluster (Mock)." />
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
            <div className="text-sm font-medium text-zinc-100">{n.title}</div>
            <div className="mt-1 text-[10px] uppercase text-zinc-500">{n.cluster}</div>
            <p className="mt-2 text-sm text-zinc-400">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
