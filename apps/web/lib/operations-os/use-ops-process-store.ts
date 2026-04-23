'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import type { Flow, FlowEdge, FlowNode, OperationalDomain } from '@/lib/operations-os/types';
import { getSeedOpsStore, OPS_PROJECT_ID, type OpsOsStore } from '@/lib/operations-os/seed-mock';

/** LocalStorage-Key für den Flow-Editor (Overlay). */
export const FLOW_OVERLAY_STORAGE_KEY = 'dashboardpro_flow_overlay_v1';
const LEGACY_OPS_OVERLAY_STORAGE_KEY = 'dashboardpro_ops_overlay_v1';

export function isUserOwnedFlow(flowId: string) {
  return flowId.startsWith('oos-flw-u-');
}

type StoredOverlay = OpsOsStore & {
  /** Demo-/Seed-Prozesse, die lokal aus der Liste ausgeblendet sind. */
  hiddenSeedFlowIds: string[];
};

function emptyOverlay(): StoredOverlay {
  return { flows: [], nodes: [], edges: [], hiddenSeedFlowIds: [] };
}

function readOverlay(): StoredOverlay {
  if (typeof window === 'undefined') return emptyOverlay();
  try {
    const newRaw = localStorage.getItem(FLOW_OVERLAY_STORAGE_KEY);
    const legacyRaw = localStorage.getItem(LEGACY_OPS_OVERLAY_STORAGE_KEY);
    const raw = newRaw ?? legacyRaw;
    if (!raw) return emptyOverlay();
    const parsed = JSON.parse(raw) as Partial<StoredOverlay>;
    const out: StoredOverlay = {
      flows: Array.isArray(parsed.flows) ? parsed.flows : [],
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      hiddenSeedFlowIds: Array.isArray(parsed.hiddenSeedFlowIds) ? parsed.hiddenSeedFlowIds : [],
    };
    if (!newRaw && legacyRaw) {
      localStorage.setItem(FLOW_OVERLAY_STORAGE_KEY, JSON.stringify(out));
      localStorage.removeItem(LEGACY_OPS_OVERLAY_STORAGE_KEY);
    }
    return out;
  } catch {
    return emptyOverlay();
  }
}

function writeOverlay(overlay: StoredOverlay) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FLOW_OVERLAY_STORAGE_KEY, JSON.stringify(overlay));
}

function filterSeedByHidden(seed: OpsOsStore, hidden: Set<string>): OpsOsStore {
  return {
    flows: seed.flows.filter((f) => !hidden.has(f.id)),
    nodes: seed.nodes.filter((n) => !hidden.has(n.flowId)),
    edges: seed.edges.filter((e) => !hidden.has(e.flowId)),
  };
}

function mergeStores(seedPart: OpsOsStore, overlayGraph: OpsOsStore): OpsOsStore {
  return {
    flows: [...seedPart.flows, ...overlayGraph.flows],
    nodes: [...seedPart.nodes, ...overlayGraph.nodes],
    edges: [...seedPart.edges, ...overlayGraph.edges],
  };
}

function parseTokenList(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type CreateFlowPayload = {
  title: string;
  description?: string;
  domain?: OperationalDomain;
  goal?: string;
  phasesText?: string;
  tagsText?: string;
};

function nowIso() {
  return new Date().toISOString();
}

/** Server-Payload in Overlay-Form bringen (lose Typisierung — API validiert Struktur). */
function normalizeRemotePayload(raw: unknown): StoredOverlay | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.flows) || !Array.isArray(o.nodes) || !Array.isArray(o.edges)) return null;
  return {
    flows: o.flows as Flow[],
    nodes: o.nodes as FlowNode[],
    edges: o.edges as FlowEdge[],
    hiddenSeedFlowIds: Array.isArray(o.hiddenSeedFlowIds)
      ? (o.hiddenSeedFlowIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
  };
}

export function useOpsProcessStore() {
  const seed = useMemo(() => getSeedOpsStore(), []);
  /** Immer zuerst leer — vermeidet Hydration-Mismatch (Server ≠ localStorage beim ersten Client-Paint). */
  const [overlay, setOverlay] = useState<StoredOverlay>(emptyOverlay);
  const pullDoneRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOverlay(readOverlay());
  }, []);

  /** Eingeloggte Nutzer: Workspace vom Server laden (pro Organisation), localStorage angleichen. */
  useEffect(() => {
    let cancelled = false;
    if (typeof window === 'undefined') {
      pullDoneRef.current = true;
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      pullDoneRef.current = true;
      return;
    }
    void (async () => {
      try {
        const { data } = await api.get<{ payload: unknown }>('/flow/workspace');
        if (cancelled) return;
        const normalized =
          data?.payload != null ? normalizeRemotePayload(data.payload) : null;
        if (normalized) {
          setOverlay(normalized);
          writeOverlay(normalized);
        }
      } catch {
        /* offline / kein Workspace */
      } finally {
        if (!cancelled) pullDoneRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const merged = useMemo(() => {
    const hidden = new Set(overlay.hiddenSeedFlowIds);
    const seedVisible = filterSeedByHidden(seed, hidden);
    return mergeStores(seedVisible, {
      flows: overlay.flows,
      nodes: overlay.nodes,
      edges: overlay.edges,
    });
  }, [seed, overlay]);

  const commitOverlay = useCallback((next: StoredOverlay) => {
    setOverlay(next);
    writeOverlay(next);
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('token')) return;
    if (!pullDoneRef.current) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null;
      void api
        .put('/flow/workspace', {
          flows: next.flows,
          nodes: next.nodes,
          edges: next.edges,
          hiddenSeedFlowIds: next.hiddenSeedFlowIds,
        })
        .catch(() => {
          /* später erneut speichern möglich */
        });
    }, 900);
  }, []);

  const addFlow = useCallback(
    (payload: CreateFlowPayload) => {
      const title = payload.title.trim();
      if (!title) return null;
      const id = `oos-flw-u-${Date.now()}`;
      const nid = `oos-nod-u-${Date.now()}`;
      const ts = nowIso();
      const flow: Flow = {
        id,
        projectId: OPS_PROJECT_ID,
        title,
        description: payload.description?.trim() || undefined,
        domain: payload.domain ?? 'generic',
        goal: payload.goal?.trim() || undefined,
        phases: payload.phasesText ? parseTokenList(payload.phasesText) : undefined,
        tags: payload.tagsText ? parseTokenList(payload.tagsText) : undefined,
        createdAt: ts,
        updatedAt: ts,
      };
      const node: FlowNode = {
        id: nid,
        projectId: OPS_PROJECT_ID,
        flowId: id,
        type: 'trigger',
        title: 'Start',
        description: 'Ersten Schritt im Katalog ergänzen oder ziehen.',
        status: 'idle',
        position: { x: 120, y: 100 },
      };
      commitOverlay({
        flows: [...overlay.flows, flow],
        nodes: [...overlay.nodes, node],
        edges: overlay.edges,
        hiddenSeedFlowIds: overlay.hiddenSeedFlowIds,
      });
      return id;
    },
    [overlay, commitOverlay],
  );

  const updateFlowMeta = useCallback(
    (flowId: string, payload: CreateFlowPayload) => {
      if (!isUserOwnedFlow(flowId)) return;
      const title = payload.title.trim();
      if (!title) return;
      const ts = nowIso();
      const nextFlows = overlay.flows.map((f) =>
        f.id === flowId
          ? {
              ...f,
              title,
              description: payload.description?.trim() || undefined,
              domain: payload.domain ?? 'generic',
              goal: payload.goal?.trim() || undefined,
              phases: payload.phasesText ? parseTokenList(payload.phasesText) : undefined,
              tags: payload.tagsText ? parseTokenList(payload.tagsText) : undefined,
              updatedAt: ts,
            }
          : f,
      );
      commitOverlay({
        ...overlay,
        flows: nextFlows,
        hiddenSeedFlowIds: overlay.hiddenSeedFlowIds,
      });
    },
    [overlay, commitOverlay],
  );

  const deleteFlow = useCallback(
    (flowId: string) => {
      if (!isUserOwnedFlow(flowId)) return;
      commitOverlay({
        flows: overlay.flows.filter((f) => f.id !== flowId),
        nodes: overlay.nodes.filter((n) => n.flowId !== flowId),
        edges: overlay.edges.filter((e) => e.flowId !== flowId),
        hiddenSeedFlowIds: overlay.hiddenSeedFlowIds,
      });
    },
    [overlay, commitOverlay],
  );

  const hideSeedFlow = useCallback(
    (flowId: string) => {
      if (isUserOwnedFlow(flowId)) return;
      if (overlay.hiddenSeedFlowIds.includes(flowId)) return;
      commitOverlay({
        ...overlay,
        hiddenSeedFlowIds: [...overlay.hiddenSeedFlowIds, flowId],
      });
    },
    [overlay, commitOverlay],
  );

  /** Eigenen Prozess löschen oder Demo-Prozess aus der Liste ausblenden. */
  const removeFlowFromWorkspace = useCallback(
    (flowId: string) => {
      if (isUserOwnedFlow(flowId)) {
        commitOverlay({
          flows: overlay.flows.filter((f) => f.id !== flowId),
          nodes: overlay.nodes.filter((n) => n.flowId !== flowId),
          edges: overlay.edges.filter((e) => e.flowId !== flowId),
          hiddenSeedFlowIds: overlay.hiddenSeedFlowIds,
        });
      } else {
        hideSeedFlow(flowId);
      }
    },
    [overlay, commitOverlay, hideSeedFlow],
  );

  const saveGraphForFlow = useCallback(
    (flowId: string, nodes: FlowNode[], edges: FlowEdge[]) => {
      if (!isUserOwnedFlow(flowId)) return;
      commitOverlay({
        ...overlay,
        nodes: [...overlay.nodes.filter((n) => n.flowId !== flowId), ...nodes],
        edges: [...overlay.edges.filter((e) => e.flowId !== flowId), ...edges],
        hiddenSeedFlowIds: overlay.hiddenSeedFlowIds,
      });
    },
    [overlay, commitOverlay],
  );

  const flowById = useCallback((id: string) => merged.flows.find((f) => f.id === id), [merged]);

  const graphForFlow = useCallback(
    (id: string) => ({
      nodes: merged.nodes.filter((n) => n.flowId === id),
      edges: merged.edges.filter((e) => e.flowId === id),
    }),
    [merged],
  );

  return {
    store: merged,
    addFlow,
    updateFlowMeta,
    deleteFlow,
    removeFlowFromWorkspace,
    saveGraphForFlow,
    flowById,
    graphForFlow,
  };
}
