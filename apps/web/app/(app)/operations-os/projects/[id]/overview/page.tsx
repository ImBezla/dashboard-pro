import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getOpsOsStore,
  opsFlowsForProject,
  opsProjectById,
} from '@/lib/operations-os/seed-mock';
import { fmtDate, fmtRel } from '@/lib/operations-os/format';
import {
  OpsOsLogLevel,
  OpsOsSection,
  OpsOsTaskStatus,
} from '@/components/operations-os/ui/ops-ui';

export default function OperationsOsProjectOverviewPage({ params }: { params: { id: string } }) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  const s = getOpsOsStore();
  const flows = opsFlowsForProject(p.id);
  const docs = s.documents.filter((d) => d.projectId === p.id);
  const tasks = s.tasks.filter((t) => t.projectId === p.id);
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const blockers = tasks.filter((t) => t.status === 'blocked');
  const logs = s.logs
    .filter(
      (l) =>
        l.entityId === p.id ||
        flows.some((f) => f.id === l.entityId) ||
        tasks.some((t) => t.id === l.entityId) ||
        docs.some((d) => d.id === l.entityId),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <OpsOsSection title="Zusammenfassung" description="Kernmetriken und Kontext für dieses Programm." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Ziel</h3>
          <p className="mt-2 text-sm text-zinc-200">{p.goal ?? '—'}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-center text-sm">
            <div className="rounded border border-zinc-800 py-2">
              <div className="font-mono text-lg text-zinc-100">{openTasks.length}</div>
              <div className="text-[10px] uppercase text-zinc-500">Offene Tasks</div>
            </div>
            <div className="rounded border border-zinc-800 py-2">
              <div className="font-mono text-lg text-zinc-100">{docs.length}</div>
              <div className="text-[10px] uppercase text-zinc-500">Dokumente</div>
            </div>
            <div className="rounded border border-zinc-800 py-2">
              <div className="font-mono text-lg text-zinc-100">{flows.length}</div>
              <div className="text-[10px] uppercase text-zinc-500">Flows</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">Risiken / Blocker</h3>
          {blockers.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Keine blockierten Tasks.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {blockers.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-zinc-300">{t.title}</span>
                  <OpsOsTaskStatus s={t.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <OpsOsSection title="Flows" />
      <ul className="grid gap-2 sm:grid-cols-2">
        {flows.map((f) => (
          <li key={f.id}>
            <Link
              href={`/operations-os/projects/${p.id}/flow?flow=${encodeURIComponent(f.id)}`}
              className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 text-sm hover:border-sky-500/30"
            >
              <span>{f.title}</span>
              <span className="font-mono text-[10px] text-zinc-500">{fmtRel(f.updatedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <OpsOsSection title="Dokumente (Auszug)" />
          <ul className="space-y-2">
            {docs.slice(0, 5).map((d) => (
              <li key={d.id} className="text-sm text-zinc-300">
                {d.title}{' '}
                <span className="text-[10px] text-zinc-500">({d.type})</span>
              </li>
            ))}
          </ul>
          <Link href={`/operations-os/projects/${p.id}/documents`} className="mt-2 inline-block text-xs text-sky-400">
            Alle Dokumente →
          </Link>
        </div>
        <div>
          <OpsOsSection title="Offene Tasks (Auszug)" />
          <ul className="space-y-2">
            {openTasks.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-zinc-300">{t.title}</span>
                <OpsOsTaskStatus s={t.status} />
              </li>
            ))}
          </ul>
          <Link href={`/operations-os/projects/${p.id}/tasks`} className="mt-2 inline-block text-xs text-sky-400">
            Task-Board →
          </Link>
        </div>
      </div>

      <OpsOsSection title="Letzte Aktivität" />
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
