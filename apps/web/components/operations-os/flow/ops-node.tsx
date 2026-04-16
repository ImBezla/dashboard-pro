'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { cn } from '@/lib/operations-os/cn';
import type { FlowNodeRunStatus, FlowNodeType } from '@/lib/operations-os/types';
import { NODE_TYPE_LABEL_DE } from '@/lib/operations-os/node-catalog';
import { OpsOsNodeRun } from '@/components/operations-os/ui/ops-ui';

export type OpsOsRfData = {
  title: string;
  /** Kurznotiz / Checkliste — im Inspektor bearbeitbar. */
  description?: string;
  nodeType: FlowNodeType;
  status: FlowNodeRunStatus;
};

const typeAccent: Partial<Record<FlowNodeType, string>> = {
  trigger: 'border-l-amber-500',
  decision: 'border-l-violet-500',
  action: 'border-l-sky-500',
  ai: 'border-l-violet-400',
  publish: 'border-l-emerald-500',
  approval: 'border-l-amber-400',
  delay: 'border-l-zinc-500',
  document: 'border-l-teal-500',
};

function Inner({ data, selected }: NodeProps) {
  const d = data as OpsOsRfData;
  const accent = typeAccent[d.nodeType] ?? 'border-l-zinc-600';
  return (
    <div
      className={cn(
        'min-w-[168px] max-w-[220px] rounded-lg border-y border-r border-border border-l-[3px] bg-white px-3 py-2.5 shadow-md ring-1 ring-black/5 dark:border-y-zinc-700/90 dark:border-r-zinc-700/90 dark:bg-[#141416] dark:shadow-lg dark:ring-black/20',
        accent,
        selected ? 'ring-2 ring-primary/35 dark:ring-sky-500/40' : '',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!min-h-[11px] !min-w-[11px] !border-2 !border-border !bg-white dark:!border-zinc-600 dark:!bg-zinc-800"
      />
      <div className="text-[9px] font-semibold uppercase tracking-wider text-text-light">
        {NODE_TYPE_LABEL_DE[d.nodeType]}
      </div>
      <div className="mt-0.5 text-xs font-semibold leading-snug text-text dark:text-zinc-100">{d.title}</div>
      {d.description ? (
        <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-text-light dark:text-zinc-400">
          {d.description}
        </p>
      ) : null}
      <div className="mt-1">
        <OpsOsNodeRun s={d.status} />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!min-h-[11px] !min-w-[11px] !border-2 !border-border !bg-white dark:!border-zinc-600 dark:!bg-zinc-800"
      />
    </div>
  );
}

export const OpsOsFlowNode = memo(Inner);
