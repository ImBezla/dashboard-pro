'use client';

import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtRel } from '@/lib/operations-os/format';
import { OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsGlobalFlowsClient() {
  const s = getOpsOsStore();
  const list = [...s.flows].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <OpsOsSection title="Alle Flows" description="Prozess-Bausteine je Projekt (Mock)." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {list.map((f) => (
          <li key={f.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-zinc-200">{f.title}</div>
              <div className="text-[10px] text-zinc-500">
                {f.domain ?? 'generic'} ·{' '}
                <Link
                  href={`/operations-os/projects/${f.projectId}/flow?flow=${encodeURIComponent(f.id)}`}
                  className="text-sky-400 hover:underline"
                >
                  Editor
                </Link>
              </div>
            </div>
            <span className="font-mono text-[10px] text-zinc-600">{fmtRel(f.updatedAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
