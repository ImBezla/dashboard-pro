'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FlowNode, FlowEdge, OperationalDomain } from '@/lib/operations-os/types';
import { OPS_PROJECT_ID } from '@/lib/operations-os/seed-mock';
import { buildPhaseSuggestions, buildTagSuggestions } from '@/lib/operations-os/process-suggestions';
import { isUserOwnedFlow, useOpsProcessStore } from '@/lib/operations-os/use-ops-process-store';
import { OpsOsFlowWorkbench } from '@/components/operations-os/flow/FlowWorkbench';
import { FieldSelect } from '@/components/ui/choice-controls';
import { ProcessMetaDialog } from '@/components/operations-os/ProcessMetaDialog';
import { ProcessGallery } from '@/components/operations-os/ProcessGallery';

const DOMAIN_LABEL: Record<OperationalDomain, string> = {
  healthcare: 'Gesundheit / Patient',
  customer_success: 'Kunde & Onboarding',
  internal: 'Intern',
  generic: 'Allgemein',
};

function FlowWorkspaceContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const {
    store,
    addFlow,
    updateFlowMeta,
    removeFlowFromWorkspace,
    restoreHiddenSeedFlows,
    overlayHiddenDemoCount,
    saveGraphForFlow,
    flowById,
    graphForFlow,
  } = useOpsProcessStore();

  const view = sp.get('view') === 'gallery' ? 'gallery' : 'editor';

  const fromUrl = sp.get('flow');
  const defaultId =
    (fromUrl && store.flows.some((f) => f.id === fromUrl) ? fromUrl : null) ??
    store.flows[0]?.id ??
    '';
  const [flowId, setFlowId] = useState(defaultId);

  useEffect(() => {
    if (view === 'gallery') return;
    const q = sp.get('flow');
    if (q && store.flows.some((f) => f.id === q)) setFlowId(q);
    else if (!q && store.flows[0]) setFlowId(store.flows[0].id);
  }, [sp, store.flows, view]);

  useEffect(() => {
    if (view === 'gallery') {
      router.replace('/flow?view=gallery', { scroll: false });
      return;
    }
    if (!flowId) return;
    router.replace(`/flow?flow=${encodeURIComponent(flowId)}`, { scroll: false });
  }, [view, flowId, router]);

  useEffect(() => {
    if (view === 'gallery') return;
    if (flowId && !store.flows.some((f) => f.id === flowId)) {
      setFlowId(store.flows[0]?.id ?? '');
    }
  }, [store.flows, flowId, view]);

  const [contextOpen, setContextOpen] = useState(false);
  useEffect(() => {
    setContextOpen(false);
  }, [flowId]);

  const [metaOpen, setMetaOpen] = useState(false);
  const [metaMode, setMetaMode] = useState<'create' | 'edit'>('create');

  const graph = useMemo(() => graphForFlow(flowId), [flowId, graphForFlow]);
  const activeFlow = useMemo(() => flowById(flowId), [flowId, flowById]);

  const stepCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of store.flows) {
      m[f.id] = graphForFlow(f.id).nodes.length;
    }
    return m;
  }, [store.flows, graphForFlow]);

  const persistGraph = useCallback(
    (nodes: FlowNode[], edges: FlowEdge[]) => {
      if (isUserOwnedFlow(flowId)) saveGraphForFlow(flowId, nodes, edges);
    },
    [flowId, saveGraphForFlow],
  );

  const phaseSuggestions = useMemo(() => buildPhaseSuggestions(store.flows), [store.flows]);
  const tagSuggestions = useMemo(() => buildTagSuggestions(store.flows), [store.flows]);

  if (view === 'gallery') {
    return (
      <>
        <ProcessMetaDialog
          open={metaOpen}
          mode={metaMode}
          initial={metaMode === 'edit' && activeFlow ? activeFlow : null}
          phaseSuggestions={phaseSuggestions}
          tagSuggestions={tagSuggestions}
          onClose={() => setMetaOpen(false)}
          onSubmit={(payload) => {
            if (metaMode === 'create') {
              const id = addFlow(payload);
              if (id) {
                setFlowId(id);
                router.replace(`/flow?flow=${encodeURIComponent(id)}`, { scroll: false });
              }
            } else if (isUserOwnedFlow(flowId)) {
              updateFlowMeta(flowId, payload);
            }
          }}
          onDelete={
            metaMode === 'edit' && isUserOwnedFlow(flowId)
              ? () => {
                  removeFlowFromWorkspace(flowId);
                  setMetaOpen(false);
                }
              : undefined
          }
        />
        <ProcessGallery
          flows={store.flows}
          stepCounts={stepCounts}
          onOpenFlow={(id) => {
            setFlowId(id);
            router.replace(`/flow?flow=${encodeURIComponent(id)}`, { scroll: false });
          }}
          onNewProcess={() => {
            setMetaMode('create');
            setMetaOpen(true);
          }}
          onEditMeta={(id) => {
            setFlowId(id);
            setMetaMode('edit');
            setMetaOpen(true);
          }}
          onRemoveFlow={removeFlowFromWorkspace}
          onGoEditor={() => {
            const id =
              (flowId && store.flows.some((f) => f.id === flowId) ? flowId : null) ??
              store.flows[0]?.id ??
              '';
            if (!id) {
              router.replace('/flow', { scroll: false });
              return;
            }
            setFlowId(id);
            router.replace(`/flow?flow=${encodeURIComponent(id)}`, { scroll: false });
          }}
          hiddenDemoCount={overlayHiddenDemoCount}
          onRestoreDemos={restoreHiddenSeedFlows}
        />
      </>
    );
  }

  if (!flowId || !store.flows.some((f) => f.id === flowId)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-sm text-text-light">
        <p>Kein Prozess vorhanden.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.replace('/flow?view=gallery', { scroll: false })}
            className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-text hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Zur Galerie
          </button>
          <Link href="/dashboard" className="text-primary hover:underline">
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const domain = activeFlow?.domain ?? 'generic';
  const domainBadge = DOMAIN_LABEL[domain];

  const hasExtendedContext = Boolean(
    activeFlow?.goal ||
      activeFlow?.description ||
      (activeFlow?.phases?.length ?? 0) > 0 ||
      (activeFlow?.tags?.length ?? 0) > 0,
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <ProcessMetaDialog
        open={metaOpen}
        mode={metaMode}
        initial={metaMode === 'edit' && activeFlow ? activeFlow : null}
        phaseSuggestions={phaseSuggestions}
        tagSuggestions={tagSuggestions}
        onClose={() => setMetaOpen(false)}
        onSubmit={(payload) => {
          if (metaMode === 'create') {
            const id = addFlow(payload);
            if (id) setFlowId(id);
          } else if (isUserOwnedFlow(flowId)) {
            updateFlowMeta(flowId, payload);
          }
        }}
        onDelete={
          metaMode === 'edit' && isUserOwnedFlow(flowId)
            ? () => {
                removeFlowFromWorkspace(flowId);
                setMetaOpen(false);
              }
            : undefined
        }
      />

      <header className="shrink-0 border-b border-border px-2 py-2 sm:px-0 sm:py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <h1 className="min-w-0 truncate text-sm font-semibold text-text dark:text-zinc-100">
              {activeFlow?.title}
            </h1>
            <span className="shrink-0 rounded-full border border-border bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-text-light dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              {domainBadge}
            </span>
            {hasExtendedContext ? (
              <button
                type="button"
                onClick={() => setContextOpen((v) => !v)}
                className="min-h-[44px] shrink-0 touch-manipulation rounded-lg border border-border bg-white/80 px-3 py-2 text-[11px] font-medium text-text-light transition-colors hover:border-primary/30 hover:text-text dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200 sm:min-h-0 sm:px-2 sm:py-1"
              >
                {contextOpen ? 'Kontext ausblenden' : 'Kontext anzeigen'}
              </button>
            ) : null}
            {isUserOwnedFlow(flowId) ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMetaMode('edit');
                    setMetaOpen(true);
                  }}
                  className="min-h-[44px] shrink-0 touch-manipulation rounded-lg border border-border bg-white/80 px-3 py-2 text-[11px] font-medium text-text-light transition-colors hover:border-primary/30 hover:text-text dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200 sm:min-h-0 sm:px-2 sm:py-1"
                >
                  Prozess bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        'Diesen eigenen Prozess inkl. gespeichertem Ablauf endgültig löschen? Das lässt sich nicht rückgängig machen.',
                      )
                    ) {
                      removeFlowFromWorkspace(flowId);
                      setMetaOpen(false);
                    }
                  }}
                  className="min-h-[44px] shrink-0 touch-manipulation rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50 sm:min-h-0 sm:px-2 sm:py-1"
                >
                  Prozess löschen
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Diese Demo-Vorlage aus deiner Liste entfernen? In der Galerie kannst du Demo-Prozesse wieder einblenden.',
                    )
                  ) {
                    removeFlowFromWorkspace(flowId);
                  }
                }}
                className="min-h-[44px] shrink-0 touch-manipulation rounded-lg border border-border bg-white/80 px-3 py-2 text-[11px] font-medium text-text-light transition-colors hover:border-red-200 hover:text-red-900 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-red-900/30 dark:hover:text-red-200 sm:min-h-0 sm:px-2 sm:py-1"
              >
                Vorlage entfernen
              </button>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.replace('/flow?view=gallery', { scroll: false })}
              className="min-h-[44px] touch-manipulation rounded-lg border border-border bg-white/80 px-3 py-2 text-[11px] font-medium text-text-light transition-colors hover:border-primary/30 hover:text-text dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200 sm:min-h-0 sm:px-2.5 sm:py-1.5"
            >
              Galerie
            </button>
            <button
              type="button"
              onClick={() => {
                setMetaMode('create');
                setMetaOpen(true);
              }}
              className="min-h-[44px] touch-manipulation rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary hover:bg-primary/15 dark:border-primary/30 dark:bg-primary/15 dark:text-indigo-200 sm:min-h-0 sm:px-2.5 sm:py-1.5"
            >
              + Neuer Prozess
            </button>
            {store.flows.length > 0 ? (
              <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                <label
                  htmlFor="ops-flow-select"
                  className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-text-light"
                >
                  Prozess
                </label>
                <FieldSelect
                  id="ops-flow-select"
                  value={flowId}
                  onChange={(e) => setFlowId(e.target.value)}
                  wrapperClassName="min-w-0 w-full max-w-full sm:max-w-[min(100%,18rem)]"
                  className="min-h-[44px] w-full py-2 pl-2.5 pr-9 text-xs sm:min-h-0"
                >
                  {store.flows.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                      {isUserOwnedFlow(f.id) ? ' (eigen)' : ''}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            ) : null}
          </div>
        </div>
        {contextOpen && hasExtendedContext ? (
          <div className="mt-2 space-y-2 border-t border-border/60 pt-2 dark:border-zinc-800">
            {activeFlow?.goal ? (
              <p className="text-xs leading-relaxed text-text-light dark:text-zinc-400">
                <span className="font-medium text-text dark:text-zinc-300">Ziel: </span>
                {activeFlow.goal}
              </p>
            ) : null}
            {activeFlow?.description ? (
              <p className="text-[11px] leading-relaxed text-text-light dark:text-zinc-500">
                {activeFlow.description}
              </p>
            ) : null}
            {(activeFlow?.phases?.length || activeFlow?.tags?.length) ? (
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px]">
                {activeFlow?.phases?.length ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="shrink-0 font-medium uppercase tracking-wide text-text-light">
                      Phasen
                    </span>
                    {activeFlow.phases.map((p) => (
                      <span
                        key={p}
                        className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-text dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : null}
                {activeFlow?.tags?.length ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="shrink-0 font-medium uppercase tracking-wide text-text-light">
                      Tags
                    </span>
                    {activeFlow.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-dashed border-border px-1.5 py-0.5 text-text-light dark:border-zinc-600 dark:text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>
      <div className="min-h-0 min-w-0 flex-1">
        <OpsOsFlowWorkbench
          flowId={flowId}
          domainNodes={graph.nodes}
          domainEdges={graph.edges}
          projectId={OPS_PROJECT_ID}
          persistEnabled={isUserOwnedFlow(flowId)}
          onPersistGraph={persistGraph}
        />
      </div>
    </div>
  );
}

export default function FlowPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-[12rem] flex-1 items-center justify-center text-sm text-text-light">
            Laden…
          </div>
        }
      >
        <FlowWorkspaceContent />
      </Suspense>
    </div>
  );
}
