import Link from 'next/link';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { fmtDate, fmtRel } from '@/lib/operations-os/format';
import {
  OpsOsKpi,
  OpsOsLogLevel,
  OpsOsSection,
  OpsOsTaskStatus,
} from '@/components/operations-os/ui/ops-ui';
import { OpsOsProjectCard } from '@/components/operations-os/ui/ops-cards';

export default function OperationsOsOverviewPage() {
  const s = getOpsOsStore();
  const activeProjects = s.projects.filter((p) => p.status === 'active').length;
  const openTasks = s.tasks.filter((t) => t.status !== 'done').length;
  const activeFlows = s.flows.length;
  const docs = s.documents.length;
  const blockedItems =
    s.tasks.filter((t) => t.status === 'blocked').length +
    s.projects.filter((p) => p.status === 'blocked').length;
  const recentLogs = [...s.logs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const health = s.projects.map((p) => {
    const t = s.tasks.filter((x) => x.projectId === p.id);
    const done = t.filter((x) => x.status === 'done').length;
    const ratio = t.length ? Math.round((done / t.length) * 100) : 0;
    return { p, ratio, open: t.filter((x) => x.status !== 'done').length };
  });

  const dueTasks = [...s.tasks]
    .filter((t) => t.dueAt && t.status !== 'done')
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
    .slice(0, 8);

  const recentDocs = [...s.documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const recentProjects = [...s.projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const activeFlowList = [...s.flows]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const errors = s.logs.filter((l) => l.level === 'error').slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Kontrollzentrum</p>
        <h1 className="mt-1 text-lg font-semibold text-zinc-100">Operations OS</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Projekt- und Workflow-Betriebssystem: Analytics, Flows, Dokumente, Tasks und Logs an einem
          Ort — rein intern, Mock-Daten.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <OpsOsKpi label="Aktive Projekte" value={String(activeProjects)} />
        <OpsOsKpi label="Offene Tasks" value={String(openTasks)} />
        <OpsOsKpi label="Flows" value={String(activeFlows)} />
        <OpsOsKpi label="Dokumente" value={String(docs)} />
        <OpsOsKpi label="Blockiert" value={String(blockedItems)} hint="Projekte + Tasks" />
        <OpsOsKpi label="Letzte Aktivität" value={fmtRel(recentLogs[0]?.timestamp ?? '')} hint="neuester Log" />
      </div>

      <OpsOsSection title="Projekt-Gesundheit" description="Erledigungsquote vs. offene Tasks (Mock)." />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {health.map(({ p, ratio, open }) => (
          <Link
            key={p.id}
            href={`/operations-os/projects/${p.id}/overview`}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 hover:border-sky-500/30"
          >
            <div className="text-xs font-medium text-zinc-200">{p.title}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-zinc-800">
              <div className="h-full bg-emerald-500/60" style={{ width: `${ratio}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
              <span>{ratio}% erledigt</span>
              <span>{open} offen</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <OpsOsSection title="Aktuelle Projekte" />
          <div className="grid gap-3">
            {recentProjects.map((p) => {
              const meta = {
                tasks: s.tasks.filter((t) => t.projectId === p.id).length,
                documents: s.documents.filter((d) => d.projectId === p.id).length,
                flows: s.flows.filter((f) => f.projectId === p.id).length,
              };
              return <OpsOsProjectCard key={p.id} p={p} meta={meta} />;
            })}
          </div>
        </div>
        <div>
          <OpsOsSection title="Aktive Flows" />
          <ul className="space-y-2">
            {activeFlowList.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/operations-os/projects/${f.projectId}/flow?flow=${encodeURIComponent(f.id)}`}
                  className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:border-sky-500/30"
                >
                  <span className="text-zinc-200">{f.title}</span>
                  <span className="font-mono text-[10px] text-zinc-500">{fmtRel(f.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <OpsOsSection title="Fällige Tasks" />
          <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {dueTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-zinc-200">{t.title}</div>
                  <div className="text-[10px] text-zinc-500">
                    <Link href={`/operations-os/projects/${t.projectId}/tasks`} className="text-sky-400">
                      Projekt
                    </Link>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <OpsOsTaskStatus s={t.status} />
                  <span className="font-mono text-[10px] text-zinc-500">{fmtDate(t.dueAt!)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <OpsOsSection title="Neueste Dokumente" />
          <ul className="space-y-2">
            {recentDocs.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/operations-os/projects/${d.projectId}/documents`}
                  className="block rounded-md border border-zinc-800 px-3 py-2 text-sm hover:border-sky-500/30"
                >
                  <span className="text-zinc-200">{d.title}</span>
                  <div className="mt-1 text-[10px] text-zinc-500">
                    {d.type} · {fmtRel(d.updatedAt)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <OpsOsSection title="Letzte Fehler / Warnungen" />
      <ul className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
        {recentLogs.map((l) => (
          <li key={l.id} className="flex gap-3 px-3 py-2 text-sm">
            <OpsOsLogLevel level={l.level} />
            <div className="min-w-0 flex-1">
              <div className="text-zinc-200">{l.message}</div>
              <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                {l.entityType} · {fmtDate(l.timestamp)}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {errors.length > 0 && (
        <>
          <OpsOsSection title="Fehler (Stichprobe)" />
          <ul className="text-sm text-red-300/90">
            {errors.map((e) => (
              <li key={e.id} className="font-mono text-xs">
                {e.message}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
