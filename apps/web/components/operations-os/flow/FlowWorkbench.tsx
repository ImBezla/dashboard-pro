'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  SelectionMode,
  ConnectionLineType,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import type { FlowEdge, FlowNode, FlowNodeType } from '@/lib/operations-os/types';
import { OpsOsFlowNode, type OpsOsRfData } from '@/components/operations-os/flow/ops-node';
import { OpsOsCanvasToolbar } from '@/components/operations-os/flow/CanvasToolbar';
import { OpsOsNodeCatalogPanel } from '@/components/operations-os/flow/NodeCatalogPanel';
import {
  FlowSelectionInspector,
  FlowSelectionInspectorMobileStrip,
  type FlowInspectorFocus,
} from '@/components/operations-os/flow/FlowSelectionInspector';
import { cn } from '@/lib/operations-os/cn';
import { useDocumentDark } from '@/lib/operations-os/use-document-dark';
import { NODE_TYPE_LABEL_DE } from '@/lib/operations-os/node-catalog';

function edgeStroke(isDark: boolean) {
  return { stroke: isDark ? '#52525b' : '#94a3b8', strokeWidth: 1.5 };
}

function edgeLabel(isDark: boolean) {
  return { fill: isDark ? '#e4e4e7' : '#475569', fontSize: 11, fontWeight: 600 };
}

function edgeLabelBg(isDark: boolean) {
  return {
    fill: isDark ? '#27272a' : '#ffffff',
    stroke: isDark ? '#52525b' : '#cbd5e1',
    strokeWidth: 1,
  };
}

function edgeMarker(isDark: boolean) {
  const color = isDark ? '#52525b' : '#94a3b8';
  return { type: MarkerType.ArrowClosed, width: 14, height: 14, color };
}

function getFullscreenElement(): Element | null {
  const d = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

async function exitDocumentFullscreen() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else await (document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen?.();
  } catch {
    /* Browser kann Vollbild ablehnen */
  }
}

async function enterElementFullscreen(el: HTMLElement) {
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else
      await (
        el as unknown as { webkitRequestFullscreen?: () => Promise<void> }
      ).webkitRequestFullscreen?.();
  } catch {
    /* ignore */
  }
}

const nodeTypes = { ops: OpsOsFlowNode };

function toRF(nodes: FlowNode[]): Node[] {
  return nodes.map((n) => ({
    id: n.id,
    type: 'ops',
    position: n.position,
    selectable: true,
    deletable: true,
    draggable: true,
    connectable: true,
    data: {
      title: n.title,
      description: n.description,
      nodeType: n.type,
      status: (n.status ?? 'idle') as OpsOsRfData['status'],
    } satisfies OpsOsRfData,
  }));
}

function rfNodesToFlowNodes(flowId: string, projectId: string, rfNodes: Node[]): FlowNode[] {
  return rfNodes.map((n) => {
    const d = n.data as OpsOsRfData;
    return {
      id: n.id,
      projectId,
      flowId,
      type: d.nodeType,
      title: d.title,
      description: d.description,
      status: d.status,
      position: { x: n.position.x, y: n.position.y },
    };
  });
}

function rfEdgesToFlowEdges(flowId: string, rfEdges: Edge[]): FlowEdge[] {
  return rfEdges.map((e) => ({
    id: e.id,
    flowId,
    source: e.source,
    target: e.target,
    label:
      typeof e.label === 'string' && e.label.trim()
        ? e.label.trim()
        : undefined,
  }));
}

function toRFEdges(edges: FlowEdge[], isDark: boolean): Edge[] {
  return edges.map((e) => {
    const hasLabel = Boolean(e.label && String(e.label).trim());
    return {
      id: e.id,
      type: 'smoothstep',
      source: e.source,
      target: e.target,
      label: e.label,
      selectable: true,
      deletable: true,
      focusable: true,
      style: edgeStroke(isDark),
      labelStyle: edgeLabel(isDark),
      labelShowBg: hasLabel,
      labelBgStyle: hasLabel ? edgeLabelBg(isDark) : undefined,
      labelBgPadding: hasLabel ? ([4, 8] as [number, number]) : undefined,
      labelBgBorderRadius: hasLabel ? 6 : undefined,
      markerEnd: edgeMarker(isDark),
    };
  });
}

function Inner({
  flowId,
  domainNodes,
  domainEdges,
  persistEnabled,
  onPersistGraph,
  projectId,
}: {
  flowId: string;
  domainNodes: FlowNode[];
  domainEdges: FlowEdge[];
  persistEnabled: boolean;
  onPersistGraph?: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  projectId: string;
}) {
  const isDark = useDocumentDark();
  const initialNodes = useMemo(() => toRF(domainNodes), [domainNodes]);
  const initialEdges = useMemo(() => toRFEdges(domainEdges, isDark), [domainEdges, isDark]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [inspectorFocus, setInspectorFocus] = useState<FlowInspectorFocus>({ type: 'none' });
  const [inspectorOpen, setInspectorOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => {
      if (mq.matches) setInspectorOpen(false);
      else setInspectorOpen(true);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const [processFullscreen, setProcessFullscreen] = useState(false);
  const rfRef = useRef<ReactFlowInstance | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncFs = () => {
      const host = canvasHostRef.current;
      setProcessFullscreen(Boolean(host && getFullscreenElement() === host));
    };
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', syncFs);
      document.removeEventListener('webkitfullscreenchange', syncFs as EventListener);
    };
  }, []);

  const onToggleProcessFullscreen = useCallback(async () => {
    const host = canvasHostRef.current;
    if (!host) return;
    if (getFullscreenElement() === host) await exitDocumentFullscreen();
    else await enterElementFullscreen(host);
  }, []);

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    setNodes(toRF(domainNodes));
    setEdges(toRFEdges(domainEdges, dark));
    setInspectorFocus({ type: 'none' });
    setInspectorOpen(true);
  }, [flowId, domainNodes, domainEdges, setNodes, setEdges]);

  useEffect(() => {
    if (!persistEnabled || !onPersistGraph) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      onPersistGraph(
        rfNodesToFlowNodes(flowId, projectId, nodes),
        rfEdgesToFlowEdges(flowId, edges),
      );
    }, 500);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [nodes, edges, flowId, projectId, persistEnabled, onPersistGraph]);

  const themeEdgeSyncStarted = useRef(false);
  useEffect(() => {
    if (!themeEdgeSyncStarted.current) {
      themeEdgeSyncStarted.current = true;
      return;
    }
    setEdges((eds) =>
      eds.map((e) => {
        const hasLabel = Boolean(e.label && String(e.label).trim());
        return {
          ...e,
          style: { ...e.style, ...edgeStroke(isDark) },
          labelStyle: { ...(e.labelStyle as object | undefined), ...edgeLabel(isDark) },
          markerEnd: edgeMarker(isDark),
          labelShowBg: hasLabel,
          labelBgStyle: hasLabel ? edgeLabelBg(isDark) : undefined,
          labelBgPadding: hasLabel ? ([4, 8] as [number, number]) : undefined,
          labelBgBorderRadius: hasLabel ? 6 : undefined,
        };
      }),
    );
  }, [isDark, setEdges]);

  const onSelectionChange = useCallback(
    ({ nodes: ns, edges: es }: { nodes: Node[]; edges: Edge[] }) => {
      if (ns.length === 1) setInspectorFocus({ type: 'node', id: ns[0].id });
      else if (ns.length > 1) setInspectorFocus({ type: 'multi' });
      else if (es.length === 1) setInspectorFocus({ type: 'edge', id: es[0].id });
      else if (es.length > 1) setInspectorFocus({ type: 'multi' });
      else setInspectorFocus({ type: 'none' });
    },
    [],
  );

  const onUpdateNode = useCallback(
    (id: string, patch: Partial<OpsOsRfData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? { ...n, data: { ...(n.data as OpsOsRfData), ...patch } satisfies OpsOsRfData }
            : n,
        ),
      );
    },
    [setNodes],
  );

  const onUpdateEdgeLabel = useCallback(
    (id: string, label: string) => {
      const trimmed = label.trim();
      const hasLabel = Boolean(trimmed);
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            label: hasLabel ? trimmed : undefined,
            labelShowBg: hasLabel,
            labelBgStyle: hasLabel ? edgeLabelBg(isDark) : undefined,
            labelBgPadding: hasLabel ? ([4, 8] as [number, number]) : undefined,
            labelBgBorderRadius: hasLabel ? 6 : undefined,
            labelStyle: edgeLabel(isDark),
          };
        }),
      );
    },
    [isDark, setEdges],
  );

  const onDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setInspectorFocus({ type: 'none' });
    },
    [setNodes, setEdges],
  );

  const onDeleteEdge = useCallback(
    (id: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== id));
      setInspectorFocus({ type: 'none' });
    },
    [setEdges],
  );

  const onConnect = useCallback(
    (p: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...p,
            type: 'smoothstep',
            animated: true,
            selectable: true,
            deletable: true,
            style: edgeStroke(isDark),
            labelStyle: edgeLabel(isDark),
            labelShowBg: false,
            markerEnd: edgeMarker(isDark),
          },
          eds,
        ),
      ),
    [setEdges, isDark],
  );

  const addNode = useCallback(
    (t: FlowNodeType) => {
      const inst = rfRef.current;
      const panelOffset = catalogOpen ? 160 : 0;
      const cx =
        typeof window !== 'undefined' ? window.innerWidth / 2 - panelOffset : 320;
      const cy = typeof window !== 'undefined' ? window.innerHeight * 0.42 : 280;
      const pos = inst ? inst.screenToFlowPosition({ x: cx, y: cy }) : { x: 200, y: 160 };
      const id = `oos-new-${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: 'ops',
          position: pos,
          selectable: true,
          deletable: true,
          draggable: true,
          connectable: true,
          data: {
            title:
              t === 'ai'
                ? 'KI-Schritt'
                : t === 'trigger'
                  ? NODE_TYPE_LABEL_DE.trigger
                  : `${NODE_TYPE_LABEL_DE[t]}`,
            description: undefined,
            nodeType: t,
            status: 'idle',
          } satisfies OpsOsRfData,
        },
      ]);
      setCatalogOpen(false);
      queueMicrotask(() => rfRef.current?.fitView({ padding: 0.2, duration: 260 }));
    },
    [setNodes, catalogOpen],
  );

  const runWorkflow = useCallback(() => {
    setExecuting(true);
    setEdges((eds) => eds.map((e) => ({ ...e, animated: true })));
    window.setTimeout(() => {
      setExecuting(false);
      setEdges((eds) => eds.map((e) => ({ ...e, animated: false })));
    }, 1800);
  }, [setEdges]);

  const tidyLayout = useCallback(() => {
    setNodes((nds) => {
      const sorted = [...nds].sort(
        (a, b) => a.position.y - b.position.y || a.position.x - b.position.x,
      );
      return sorted.map((n, i) => ({
        ...n,
        position: { x: 48 + i * 220, y: 120 },
      }));
    });
    queueMicrotask(() => rfRef.current?.fitView({ padding: 0.18, duration: 280 }));
  }, [setNodes]);

  const isEmpty = nodes.length === 0;
  const rfColorMode = isDark ? 'dark' : 'light';
  const miniMask = isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.75)';
  const miniNode = isDark ? '#52525b' : '#94a3b8';

  const inspectorProps = {
    focus: inspectorFocus,
    nodes,
    edges,
    isDark,
    onUpdateNode,
    onUpdateEdgeLabel,
    onDeleteNode,
    onDeleteEdge,
    onCollapseSidePanel: () => setInspectorOpen(false),
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-light dark:bg-[#0c0c0e]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row">
        {inspectorOpen ? (
          <FlowSelectionInspector {...inspectorProps} />
        ) : (
          <button
            type="button"
            title="Bearbeiten-Panel einblenden"
            aria-label="Bearbeiten-Panel einblenden"
            onClick={() => setInspectorOpen(true)}
            className="pointer-events-auto z-[15] hidden h-full w-9 shrink-0 flex-col items-center justify-center border-r border-border bg-white/95 text-sm font-medium text-text-light shadow-sm transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-500 dark:hover:bg-zinc-900 sm:flex"
          >
            ⟨
          </button>
        )}
        <div
          ref={canvasHostRef}
          className={cn(
            'relative min-h-0 min-w-0 flex-1',
            processFullscreen && 'bg-light dark:bg-[#0c0c0e]',
          )}
        >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.08}
          maxZoom={2}
          colorMode={rfColorMode}
          connectionLineType={ConnectionLineType.SmoothStep}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          panActivationKeyCode="Space"
          elevateEdgesOnSelect
          nodesConnectable
          connectionRadius={28}
          defaultEdgeOptions={{
            type: 'smoothstep',
            selectable: true,
            deletable: true,
            focusable: true,
            markerEnd: edgeMarker(isDark),
          }}
          onInit={(inst) => {
            rfRef.current = inst;
          }}
          className="!h-full !w-full !bg-light dark:!bg-[#0c0c0e]"
        >
          <OpsOsCanvasToolbar
            catalogOpen={catalogOpen}
            onToggleCatalog={() => setCatalogOpen((v) => !v)}
            executing={executing}
            onExecute={runWorkflow}
            onTidy={tidyLayout}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen((v) => !v)}
            processFullscreen={processFullscreen}
            onToggleProcessFullscreen={onToggleProcessFullscreen}
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={isDark ? '#3f3f46' : '#cbd5e1'}
            className="opacity-95"
          />
          <Controls
            position="bottom-left"
            showInteractive={false}
            className="!mb-[max(0.75rem,env(safe-area-inset-bottom))] !ml-[max(0.75rem,env(safe-area-inset-left))] !mr-2 !mt-2 !overflow-hidden !rounded-lg !border !border-border !bg-white/95 !shadow-md sm:!m-3 dark:!border-zinc-700/90 dark:!bg-zinc-900/95 dark:!shadow-lg [&_button]:!min-h-[40px] [&_button]:!min-w-[40px] sm:[&_button]:!min-h-0 sm:[&_button]:!min-w-0 [&_button]:!border-border [&_button]:!bg-white [&_button]:!text-text dark:[&_button]:!border-zinc-700 dark:[&_button]:!bg-zinc-900 dark:[&_button]:!text-zinc-300 [&_button:hover]:!bg-slate-100 dark:[&_button:hover]:!bg-zinc-800"
          />
          <MiniMap
            position="bottom-right"
            className="!mb-[max(0.75rem,env(safe-area-inset-bottom))] !mr-[max(0.75rem,env(safe-area-inset-right))] !mt-2 hidden !overflow-hidden !rounded-lg !border !border-border !bg-white/95 !shadow-md lg:!m-3 lg:block dark:!border-zinc-700/80 dark:!bg-zinc-950/90 dark:!shadow-lg"
            maskColor={miniMask}
            nodeColor={() => miniNode}
            pannable
            zoomable
          />
          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
              <div className="pointer-events-auto flex max-w-md flex-col items-center gap-4 px-4 text-center">
                <p className="text-sm font-medium text-text">
                  Ersten Schritt hinzufügen
                  <span className="mt-1 block text-xs font-normal text-text-light">
                    Wie in n8n: oben rechts auf <strong>+</strong> tippen oder Trigger wählen.
                  </span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => addNode('trigger')}
                    className="flex min-h-[7rem] min-w-[10rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/90 text-center transition-colors hover:border-primary/50 hover:bg-slate-50 dark:border-zinc-600 dark:bg-zinc-950/50 dark:hover:border-zinc-500"
                  >
                    <span className="text-2xl">⚡</span>
                    <span className="text-xs font-medium text-text">Trigger starten</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogOpen(true)}
                    className="flex min-h-[7rem] min-w-[10rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-white/90 text-center transition-colors hover:border-primary/40 dark:border-zinc-600 dark:bg-zinc-950/50"
                  >
                    <span className="text-xl font-light text-primary">+</span>
                    <span className="text-xs font-medium text-text">Katalog öffnen</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </ReactFlow>
        </div>
      </div>
      {inspectorOpen ? <FlowSelectionInspectorMobileStrip {...inspectorProps} /> : null}

      <OpsOsNodeCatalogPanel
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onPick={addNode}
        hasNodes={nodes.length > 0}
      />
    </div>
  );
}

export function OpsOsFlowWorkbench({
  flowId,
  domainNodes,
  domainEdges,
  className,
  persistEnabled = false,
  onPersistGraph,
  projectId,
}: {
  flowId: string;
  domainNodes: FlowNode[];
  domainEdges: FlowEdge[];
  className?: string;
  /** Nur bei eigenen Prozessen: Ablauf in localStorage sichern. */
  persistEnabled?: boolean;
  onPersistGraph?: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  projectId: string;
}) {
  return (
    <div className={cn('flex h-full min-h-0 min-w-0 flex-1 flex-col', className)}>
      <ReactFlowProvider key={flowId}>
        <Inner
          flowId={flowId}
          domainNodes={domainNodes}
          domainEdges={domainEdges}
          persistEnabled={persistEnabled}
          onPersistGraph={onPersistGraph}
          projectId={projectId}
        />
      </ReactFlowProvider>
    </div>
  );
}
