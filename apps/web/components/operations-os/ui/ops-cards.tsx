import Link from 'next/link';
import type { Project } from '@/lib/operations-os/types';
import { fmtRel } from '@/lib/operations-os/format';

export function OpsOsProjectCard({
  p,
  meta,
}: {
  p: Project;
  meta: { tasks: number; documents: number; flows: number };
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <Link href={`/operations-os/projects/${p.id}/overview`} className="text-sm font-medium text-zinc-100 hover:text-sky-400">
        {p.title}
      </Link>
      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{p.description ?? '—'}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500">
        <span>{meta.tasks} Tasks</span>
        <span>·</span>
        <span>{meta.documents} Docs</span>
        <span>·</span>
        <span>{meta.flows} Flows</span>
        <span className="ml-auto font-mono">{fmtRel(p.updatedAt)}</span>
      </div>
    </div>
  );
}
