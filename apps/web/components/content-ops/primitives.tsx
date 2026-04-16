import type { ReactNode } from 'react';
import { cn } from '@/lib/content-ops/cn';
import type {
  AccountStatus,
  AutomationJobType,
  ContentStage,
  JobStatus,
  ModerationStatus,
  ProcessStatus,
  Priority,
} from '@/lib/content-ops/types';
import type { ActivityLevel } from '@/lib/content-ops/types';
import { formatDateTime, formatRelative } from '@/lib/content-ops/format';

const card = 'rounded-lg border border-zinc-700/80 bg-zinc-900/40';
const muted = 'text-zinc-400';
const text = 'text-zinc-100';
const faint = 'text-zinc-500';

export function CoKpiCard({
  label,
  value,
  hint,
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; text: string };
  className?: string;
}) {
  return (
    <div className={cn(card, 'px-4 py-3 shadow-sm', className)}>
      <div className={cn('text-xs font-medium uppercase tracking-wide', faint)}>{label}</div>
      <div className={cn('mt-1 font-mono text-2xl font-semibold tabular-nums', text)}>
        {value}
      </div>
      {(hint || trend) && (
        <div className={cn('mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs', muted)}>
          {trend && (
            <span
              className={cn(
                'font-medium',
                trend.direction === 'up' && 'text-emerald-400',
                trend.direction === 'down' && 'text-red-400',
                trend.direction === 'flat' && faint,
              )}
            >
              {trend.text}
            </span>
          )}
          {hint && <span className={faint}>{hint}</span>}
        </div>
      )}
    </div>
  );
}

const pStyles: Record<ProcessStatus, string> = {
  draft: 'bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-600',
  pending: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  running: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  blocked: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
  review: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  done: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  failed: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
};

const jStyles: Record<JobStatus, string> = {
  idle: 'bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-600',
  queued: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  running: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  failed: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
  paused: 'bg-zinc-700/50 text-zinc-400 ring-1 ring-zinc-600',
  blocked: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
};

const aStyles: Record<AccountStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  paused: 'bg-zinc-700/50 text-zinc-400 ring-1 ring-zinc-600',
  restricted: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
};

const cStyles: Record<ContentStage, string> = {
  idea: 'bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-600',
  generated: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  review: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  approved: 'bg-emerald-500/12 text-emerald-200/90 ring-1 ring-emerald-500/25',
  scheduled: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  published: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  failed: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
};

const mStyles: Record<ModerationStatus, string> = {
  open: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  reviewing: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  flagged: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
};

function lab(s: string) {
  return s.replace(/_/g, ' ');
}

export function CoProcessStatusBadge({ status }: { status: ProcessStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        pStyles[status],
      )}
    >
      {lab(status)}
    </span>
  );
}

export function CoJobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        jStyles[status],
      )}
    >
      {lab(status)}
    </span>
  );
}

export function CoAccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        aStyles[status],
      )}
    >
      {lab(status)}
    </span>
  );
}

export function CoContentStageBadge({ stage }: { stage: ContentStage }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        cStyles[stage],
      )}
    >
      {lab(stage)}
    </span>
  );
}

export function CoModerationStatusBadge({ status }: { status: ModerationStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        mStyles[status],
      )}
    >
      {lab(status)}
    </span>
  );
}

const pri: Record<Priority, string> = {
  low: 'bg-zinc-800/80 text-zinc-400 ring-1 ring-zinc-600',
  medium: 'bg-sky-500/12 text-sky-200/90 ring-1 ring-sky-500/25',
  high: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  critical: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35',
};

export function CoPriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold capitalize tracking-wide',
        pri[priority],
      )}
    >
      {priority}
    </span>
  );
}

export function CoSectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 border-b border-zinc-700/80 pb-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className={cn('text-sm font-semibold tracking-tight', text)}>{title}</h2>
        {description && <p className={cn('mt-1 max-w-2xl text-xs', muted)}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CoSearchInput({
  value,
  onChange,
  placeholder = 'Suchen…',
  className,
  'aria-label': ariaLabel = 'Suchen',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
      </span>
      <input
        aria-label={ariaLabel}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 py-1.5 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
    </div>
  );
}

export type CoFilterChip = { id: string; label: string; active?: boolean; onClick?: () => void };

export function CoFilterBar({
  chips,
  children,
  className,
}: {
  chips?: CoFilterChip[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className,
      )}
    >
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={c.onClick}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                c.active
                  ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                  : 'border-transparent bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      {children && (
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}

export type CoColumn<T> = {
  id: string;
  header: string;
  width?: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function CoDataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyMessage = 'Keine Einträge',
}: {
  columns: CoColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div
        className={cn(
          card,
          'border-dashed px-4 py-8 text-center text-sm',
          muted,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-950/40')}>
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700/80 bg-zinc-900/80">
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                className={cn(
                  'border-b border-zinc-800 last:border-0',
                  onRowClick &&
                    'cursor-pointer hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:outline-none',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      'max-w-[280px] truncate px-3 py-2 align-middle text-zinc-200',
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CoPagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-zinc-700/80 pt-3 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <span>
        {from}–{to} von {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 font-medium text-zinc-100 disabled:opacity-40"
        >
          Zurück
        </button>
        <span className="px-2 tabular-nums">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 font-medium text-zinc-100 disabled:opacity-40"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}

export function CoChartContainer({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(card, 'p-4 shadow-sm', className)}>
      <div className="mb-3">
        <h3 className={cn('text-sm font-semibold', text)}>{title}</h3>
        {subtitle && <p className={cn('mt-0.5 text-xs', muted)}>{subtitle}</p>}
      </div>
      <div className="min-h-[180px]">{children}</div>
    </div>
  );
}

const levelDot: Record<ActivityLevel, string> = {
  info: 'bg-sky-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
};

export function CoLogRow({
  timestamp,
  level,
  entityLabel,
  message,
  className,
}: {
  timestamp: string;
  level: ActivityLevel;
  entityLabel: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 border-b border-zinc-800 py-2.5 text-xs last:border-0',
        className,
      )}
    >
      <div className="w-36 shrink-0 font-mono text-zinc-500">{formatDateTime(timestamp)}</div>
      <div className="flex w-20 shrink-0 items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', levelDot[level])} />
        <span className="uppercase text-zinc-400">{level}</span>
      </div>
      <div className="w-28 shrink-0 truncate text-zinc-500">{entityLabel}</div>
      <div className="min-w-0 flex-1 text-zinc-200">{message}</div>
    </div>
  );
}

export function CoAccountHealthIndicator({ score }: { score: number }) {
  const tone =
    score >= 85 ? 'text-emerald-400' : score >= 65 ? 'text-amber-300' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn(
            'h-full rounded-full',
            score >= 85 && 'bg-emerald-400',
            score >= 65 && score < 85 && 'bg-amber-400',
            score < 65 && 'bg-red-400',
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={cn('font-mono text-xs tabular-nums', tone)}>{score}</span>
    </div>
  );
}

const typeLabel: Record<AutomationJobType, string> = {
  collector: 'Collector',
  generator: 'Generator',
  scheduler: 'Scheduler',
  publisher: 'Publisher',
  moderation: 'Moderation',
  analytics: 'Analytics',
};

export function CoWorkflowCard({
  name,
  type,
  status,
  meta,
  actions,
  className,
}: {
  name: string;
  type: AutomationJobType;
  status: JobStatus;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(card, 'flex flex-col p-3 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={cn('truncate text-sm font-medium', text)}>{name}</div>
          <div className={cn('mt-0.5 text-[11px] font-medium uppercase tracking-wide', faint)}>
            {typeLabel[type]}
          </div>
        </div>
        <CoJobStatusBadge status={status} />
      </div>
      {meta && <div className={cn('mt-3 space-y-1 text-xs', muted)}>{meta}</div>}
      {actions && <div className="mt-3 flex flex-wrap gap-1.5">{actions}</div>}
    </div>
  );
}

export type CoTimelineItem = { id: string; title: string; time: string; detail?: string };

export function CoActivityTimeline({ items, className }: { items: CoTimelineItem[]; className?: string }) {
  return (
    <ul className={cn('space-y-0', className)}>
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute bottom-0 left-[7px] top-2 w-px bg-zinc-700" aria-hidden />
          )}
          <span className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-zinc-600 bg-zinc-800" />
          <div className="min-w-0 pt-0.5">
            <div className="text-xs font-medium text-zinc-100">{item.title}</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              {formatRelative(item.time)}
              {item.detail && <span className="text-zinc-400"> · {item.detail}</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
