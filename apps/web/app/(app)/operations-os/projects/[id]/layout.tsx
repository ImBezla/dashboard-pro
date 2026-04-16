import Link from 'next/link';
import { notFound } from 'next/navigation';
import { opsFlowsForProject, opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsProjectTabNav } from '@/components/operations-os/project/ProjectTabNav';
import { OpsOsPriority, OpsOsProjectStatus } from '@/components/operations-os/ui/ops-ui';
import { fmtDate } from '@/lib/operations-os/format';

export default function OperationsOsProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const p = opsProjectById(params.id);
  if (!p) notFound();

  const flows = opsFlowsForProject(p.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/operations-os/projects"
            className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-sky-400"
          >
            ← Projekte
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-zinc-100">{p.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">{p.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <OpsOsProjectStatus status={p.status} />
            <OpsOsPriority p={p.priority} />
            {p.owner && <span>Owner: {p.owner}</span>}
            {p.deadline && <span className="font-mono">Deadline {fmtDate(p.deadline)}</span>}
            <span className="font-mono text-zinc-600">{flows.length} flows</span>
          </div>
        </div>
      </div>
      <OpsOsProjectTabNav projectId={p.id} />
      {children}
    </div>
  );
}
