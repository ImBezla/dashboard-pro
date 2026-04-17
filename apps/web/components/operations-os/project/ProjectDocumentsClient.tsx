'use client';

import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtRel } from '@/lib/operations-os/format';
import { OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsProjectDocumentsClient({ projectId }: { projectId: string }) {
  const s = getOpsOsStore();
  const docs = s.documents.filter((d) => d.projectId === projectId);

  return (
    <div className="space-y-4">
      <OpsOsSection title="Dokumente" description="Briefings, SOPs und Research (Mock)." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {docs.map((d) => (
          <li key={d.id} className="px-3 py-2 text-sm">
            <div className="text-zinc-200">{d.title}</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">
              {d.type} · {fmtRel(d.updatedAt)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
