'use client';

import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtRel } from '@/lib/operations-os/format';
import { OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsGlobalDocumentsClient() {
  const s = getOpsOsStore();
  const docs = [...s.documents].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <OpsOsSection title="Alle Dokumente" description="Übergreifende Liste (Mock-Daten)." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-zinc-200">{d.title}</div>
              <div className="text-[10px] text-zinc-500">
                {d.type} ·{' '}
                <Link href={`/operations-os/projects/${d.projectId}/documents`} className="text-sky-400 hover:underline">
                  Projekt öffnen
                </Link>
              </div>
            </div>
            <span className="font-mono text-[10px] text-zinc-600">{fmtRel(d.updatedAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
