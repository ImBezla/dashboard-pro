import { cn } from '@/lib/operations-os/cn';
import type { FlowNodeRunStatus } from '@/lib/operations-os/types';

const ns: Record<FlowNodeRunStatus, string> = {
  idle: 'text-slate-500 dark:text-zinc-500',
  active: 'text-sky-600 dark:text-sky-400',
  done: 'text-emerald-600 dark:text-emerald-400',
  failed: 'text-red-600 dark:text-red-400',
  blocked: 'text-amber-600 dark:text-amber-400',
};

export function OpsOsNodeRun({ s }: { s: FlowNodeRunStatus }) {
  return (
    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', ns[s])}>{s}</span>
  );
}
