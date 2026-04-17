'use client';

import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtDate } from '@/lib/operations-os/format';
import { OpsOsLogLevel, OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsGlobalLogsClient() {
  const s = getOpsOsStore();
  const logs = [...s.logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="space-y-4">
      <OpsOsSection title="Globale Logs" description="Letzte Ereignisse über alle Entitäten (Mock)." />
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {logs.map((l) => (
          <li key={l.id} className="flex gap-3 px-3 py-2 text-sm">
            <OpsOsLogLevel level={l.level} />
            <div className="min-w-0 flex-1">
              <div className="text-zinc-200">{l.message}</div>
              <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                <span>
                  {l.entityType} ·{' '}
                  <Link
                    href={`/operations-os/projects/${l.entityId}/overview`}
                    className="text-sky-400 hover:underline"
                  >
                    {l.entityId}
                  </Link>
                </span>
                <span className="font-mono">{fmtDate(l.timestamp)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
