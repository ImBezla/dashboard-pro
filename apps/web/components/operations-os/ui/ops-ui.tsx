import type { ReactNode } from 'react';
import { cn } from '@/lib/operations-os/cn';
import type {
  ActivityLog,
  FlowNodeRunStatus,
  LogLevel,
  Milestone,
  Priority,
  ProjectStatus,
  TaskStatus,
} from '@/lib/operations-os/types';

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

export function OpsOsKpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 font-mono text-lg text-zinc-100">{value}</div>
      {hint ? <div className="mt-0.5 text-[10px] text-zinc-600">{hint}</div> : null}
    </div>
  );
}

export function OpsOsSection({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      {description ? <p className="mt-1 max-w-2xl text-xs text-zinc-500">{description}</p> : null}
    </div>
  );
}

const taskStatusClass: Record<TaskStatus, string> = {
  todo: 'bg-zinc-700 text-zinc-200',
  'in-progress': 'bg-sky-900/50 text-sky-200',
  review: 'bg-amber-900/40 text-amber-200',
  done: 'bg-emerald-900/40 text-emerald-200',
  blocked: 'bg-red-900/40 text-red-200',
};

export function OpsOsTaskStatus({ s }: { s: TaskStatus }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        taskStatusClass[s],
      )}
    >
      {s}
    </span>
  );
}

const logLevelClass: Record<LogLevel, string> = {
  info: 'bg-zinc-800 text-zinc-300',
  warning: 'bg-amber-900/40 text-amber-200',
  error: 'bg-red-900/40 text-red-200',
};

export function OpsOsLogLevel({ level }: { level: LogLevel }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
        logLevelClass[level],
      )}
    >
      {level}
    </span>
  );
}

export type OpsOsTableColumn<T> = {
  id: string;
  header: string;
  width?: string;
  cell: (row: T) => ReactNode;
};

export function OpsOsTable<T extends { id: string }>({
  rows,
  columns,
}: {
  rows: T[];
  columns: OpsOsTableColumn<T>[];
}) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-sm text-zinc-500">Keine Einträge.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            {columns.map((c) => (
              <th
                key={c.id}
                className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.id} className="bg-zinc-950/40">
              {columns.map((c) => (
                <td key={c.id} className="px-3 py-2 align-top text-zinc-300">
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const projectStatusClass: Record<ProjectStatus, string> = {
  idea: 'text-zinc-400',
  planning: 'text-sky-300',
  active: 'text-emerald-300',
  blocked: 'text-red-300',
  review: 'text-amber-300',
  completed: 'text-zinc-500',
  archived: 'text-zinc-600',
};

export function OpsOsProjectStatus({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', projectStatusClass[status])}>
      {status}
    </span>
  );
}

const priorityClass: Record<Priority, string> = {
  low: 'text-zinc-500',
  medium: 'text-sky-400',
  high: 'text-amber-400',
  critical: 'text-red-400',
};

export function OpsOsPriority({ p }: { p: Priority }) {
  return <span className={cn('text-[10px] font-semibold uppercase', priorityClass[p])}>{p}</span>;
}

export function OpsOsTimeline({
  milestones,
  logs,
}: {
  milestones: Milestone[];
  logs: ActivityLog[];
}) {
  const items = [
    ...milestones.map((m) => ({
      id: `m-${m.id}`,
      at: m.at,
      title: m.title,
      kind: `Meilenstein (${m.kind})`,
    })),
    ...logs.map((l) => ({
      id: `l-${l.id}`,
      at: l.timestamp,
      title: l.message,
      kind: `${l.level} · ${l.entityType}`,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <ul className="space-y-2 rounded-lg border border-zinc-800 p-3">
      {items.map((it) => (
        <li key={it.id} className="flex gap-3 border-b border-zinc-800/80 py-2 last:border-0">
          <span className="w-36 shrink-0 font-mono text-[10px] text-zinc-500">{it.at.slice(0, 16)}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-zinc-200">{it.title}</div>
            <div className="text-[10px] text-zinc-500">{it.kind}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
