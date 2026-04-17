'use client';

import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtRel } from '@/lib/operations-os/format';
import { OpsOsProjectStatus, OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsProjectsPageClient() {
  const s = getOpsOsStore();

  return (
    <div className="space-y-4">
      <OpsOsSection title="Projekte" description="Alle Programme im Mock-Workspace." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {s.projects.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/operations-os/projects/${p.id}/overview`} className="text-sm font-medium text-zinc-100 hover:text-sky-400">
                {p.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                <OpsOsProjectStatus status={p.status} />
                <span className="font-mono">{fmtRel(p.updatedAt)}</span>
              </div>
            </div>
            <Link
              href={`/operations-os/projects/${p.id}/overview`}
              className="shrink-0 text-xs text-sky-400 hover:underline"
            >
              Öffnen →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
