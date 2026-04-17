'use client';

import { useMemo, useState } from 'react';
import { getOpsOsStore } from '@/lib/operations-os/seed-mock';
import { OpsOsFlowWorkbench } from '@/components/operations-os/flow/FlowWorkbench';
import { OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export function OpsOsProjectFlowClient({
  projectId,
  flowIds,
  initialFlowId,
}: {
  projectId: string;
  flowIds: string[];
  initialFlowId: string | null;
}) {
  const s = getOpsOsStore();
  const [flowId, setFlowId] = useState(() => initialFlowId && flowIds.includes(initialFlowId) ? initialFlowId : flowIds[0] ?? '');

  const { nodes, edges } = useMemo(() => {
    if (!flowId) return { nodes: [] as typeof s.nodes, edges: [] as typeof s.edges };
    return {
      nodes: s.nodes.filter((n) => n.flowId === flowId),
      edges: s.edges.filter((e) => e.flowId === flowId),
    };
  }, [s.nodes, s.edges, flowId]);

  if (!flowIds.length) {
    return <p className="text-sm text-zinc-500">Keine Flows für dieses Projekt.</p>;
  }

  return (
    <div className="flex min-h-[520px] flex-col gap-3">
      <OpsOsSection title="Flow-Editor" description="Wähle einen Flow — Mock-Daten, lokaler Canvas." />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase text-zinc-500">Flow</span>
        <select
          className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
          value={flowId}
          onChange={(e) => setFlowId(e.target.value)}
        >
          {flowIds.map((id) => {
            const f = s.flows.find((x) => x.id === id);
            return (
              <option key={id} value={id}>
                {f?.title ?? id}
              </option>
            );
          })}
        </select>
      </div>
      <div className="min-h-[480px] flex-1 overflow-hidden rounded-lg border border-zinc-800">
        {flowId ? (
          <OpsOsFlowWorkbench flowId={flowId} domainNodes={nodes} domainEdges={edges} projectId={projectId} className="h-[480px]" />
        ) : null}
      </div>
    </div>
  );
}
