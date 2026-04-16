'use client';

import type { Edge, Node } from '@xyflow/react';
import type { FlowNodeRunStatus, FlowNodeType } from '@/lib/operations-os/types';
import { NODE_TYPE_LABEL_DE, flattenCatalogTypes } from '@/lib/operations-os/node-catalog';
import type { OpsOsRfData } from '@/components/operations-os/flow/ops-node';
import { FieldSelect, SegmentedControl } from '@/components/ui/choice-controls';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { cn } from '@/lib/operations-os/cn';

export type FlowInspectorFocus =
  | { type: 'none' }
  | { type: 'multi' }
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string };

const STATUS_OPTIONS: FlowNodeRunStatus[] = ['idle', 'active', 'done', 'failed', 'blocked'];

const STATUS_LABEL_DE: Record<FlowNodeRunStatus, string> = {
  idle: 'Ausstehend',
  active: 'Aktiv',
  done: 'Erledigt',
  failed: 'Fehler',
  blocked: 'Blockiert',
};

type Props = {
  focus: FlowInspectorFocus;
  nodes: Node[];
  edges: Edge[];
  isDark: boolean;
  onUpdateNode: (id: string, patch: Partial<OpsOsRfData>) => void;
  onUpdateEdgeLabel: (id: string, label: string) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  /** Schmale Leiste links einklappen (nur Desktop). */
  onCollapseSidePanel?: () => void;
};

function nodeData(n: Node): OpsOsRfData {
  return n.data as OpsOsRfData;
}

function PanelHeader({
  title,
  subtitle,
  onCollapse,
}: {
  title: string;
  subtitle?: string;
  onCollapse?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2.5 dark:border-zinc-800">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] font-medium normal-case tracking-normal text-text-light dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {onCollapse ? (
        <button
          type="button"
          title="Panel ausblenden"
          aria-label="Bearbeiten-Panel ausblenden"
          onClick={onCollapse}
          className="shrink-0 rounded-md px-1.5 py-1 text-xs text-text-light transition-colors hover:bg-slate-100 hover:text-text dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          ⟨
        </button>
      ) : null}
    </div>
  );
}

export function FlowSelectionInspector({
  focus,
  nodes,
  edges,
  isDark,
  onUpdateNode,
  onUpdateEdgeLabel,
  onDeleteNode,
  onDeleteEdge,
  onCollapseSidePanel,
}: Props) {
  const panelClass = cn(
    'pointer-events-auto flex h-full min-h-0 w-[min(20rem,92vw)] flex-col border-r border-border shadow-lg backdrop-blur-sm',
    isDark ? 'bg-zinc-950/95 text-zinc-100' : 'bg-white/98 text-text',
  );

  const inputClass = cn(
    'w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/35',
    isDark
      ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500'
      : 'border-border bg-white text-text placeholder:text-text-light',
  );

  const labelClass = 'text-[10px] font-semibold uppercase tracking-wide text-text-light dark:text-zinc-500';

  if (focus.type === 'none') {
    return (
      <aside className={cn('pointer-events-none z-[15] hidden h-full shrink-0 sm:flex sm:w-[min(20rem,92vw)]')}>
        <div className={panelClass}>
          <PanelHeader title="Bearbeiten" onCollapse={onCollapseSidePanel} />
          <div className="min-h-0 flex-1 overflow-y-auto p-3 text-xs leading-relaxed text-text-light dark:text-zinc-400">
            <p>
              Wähle einen <strong>Schritt</strong> oder eine <strong>Verbindungslinie</strong>, um Titel,
              Beschreibung, Typ bzw. die Beschriftung der Linie (z. B. „ja“, „nein“) zu bearbeiten.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  if (focus.type === 'multi') {
    return (
      <aside className="pointer-events-none z-[15] hidden h-full shrink-0 sm:flex sm:w-[min(20rem,92vw)]">
        <div className={panelClass}>
          <PanelHeader title="Bearbeiten" onCollapse={onCollapseSidePanel} />
          <div className="p-3 text-xs text-text-light dark:text-zinc-400">
            Mehrere Elemente ausgewählt. Wähle genau einen Schritt oder eine Verbindung, um sie zu bearbeiten.
          </div>
        </div>
      </aside>
    );
  }

  if (focus.type === 'edge') {
    const edge = edges.find((e) => e.id === focus.id);
    if (!edge) {
      return (
        <aside className="pointer-events-none z-[15] hidden h-full shrink-0 sm:flex sm:w-[min(20rem,92vw)]">
          <div className={panelClass}>
            <div className="p-3 text-xs text-text-light">Verbindung nicht gefunden.</div>
          </div>
        </aside>
      );
    }
    const src = nodes.find((n) => n.id === edge.source);
    const tgt = nodes.find((n) => n.id === edge.target);
    const srcTitle = src ? nodeData(src).title : edge.source;
    const tgtTitle = tgt ? nodeData(tgt).title : edge.target;
    const labelVal = typeof edge.label === 'string' ? edge.label : edge.label != null ? String(edge.label) : '';

    return (
      <aside className="pointer-events-none z-[15] hidden h-full shrink-0 sm:flex sm:w-[min(20rem,92vw)]">
        <div className={panelClass}>
          <PanelHeader title="Verbindung" onCollapse={onCollapseSidePanel} />
          <p className="border-b border-border px-3 pb-2.5 text-[11px] leading-snug text-text-light dark:border-zinc-800 dark:text-zinc-400">
            <span className="font-medium text-text dark:text-zinc-300">{srcTitle}</span>
            <span className="mx-1 text-text-light">→</span>
            <span className="font-medium text-text dark:text-zinc-300">{tgtTitle}</span>
          </p>
          <div key={edge.id} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            <CollapsibleSection title="Beschriftung" defaultOpen>
              <label className="sr-only" htmlFor="ops-edge-label">
                Beschriftung am Strich
              </label>
              <input
                id="ops-edge-label"
                type="text"
                value={labelVal}
                onChange={(e) => onUpdateEdgeLabel(edge.id, e.target.value)}
                placeholder="z. B. ja, nein, bei Fehler, Standard"
                className={inputClass}
              />
              <CollapsibleSection title="Hinweis" defaultOpen={false}>
                <p className="text-[10px] leading-snug text-text-light dark:text-zinc-500">
                  Die Beschriftung erscheint auf der Linie mit Hintergrund, damit sie gut lesbar bleibt.
                </p>
              </CollapsibleSection>
            </CollapsibleSection>
            <button
              type="button"
              onClick={() => onDeleteEdge(edge.id)}
              className="w-full rounded-md border border-red-200 bg-red-50 px-2 py-2 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
            >
              Verbindung löschen
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const node = nodes.find((n) => n.id === focus.id);
  if (!node) {
    return (
      <aside className="pointer-events-none z-[15] hidden h-full shrink-0 sm:flex sm:w-[min(20rem,92vw)]">
        <div className={panelClass}>
          <div className="p-3 text-xs text-text-light">Schritt nicht gefunden.</div>
        </div>
      </aside>
    );
  }

  const d = nodeData(node);
  const catalogTypes = flattenCatalogTypes();

  return (
    <aside className="pointer-events-none z-[15] hidden h-full shrink-0 sm:flex sm:w-[min(20rem,92vw)]">
      <div className={panelClass}>
        <PanelHeader
          title="Schritt bearbeiten"
          subtitle={NODE_TYPE_LABEL_DE[d.nodeType]}
          onCollapse={onCollapseSidePanel}
        />
        <div key={node.id} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          <CollapsibleSection title="Titel & Notiz" defaultOpen>
            <div>
              <label className={labelClass} htmlFor="ops-node-title">
                Titel
              </label>
              <input
                id="ops-node-title"
                type="text"
                value={d.title}
                onChange={(e) => onUpdateNode(node.id, { title: e.target.value })}
                className={cn(inputClass, 'mt-1')}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ops-node-desc">
                Beschreibung / Notiz
              </label>
              <textarea
                id="ops-node-desc"
                value={d.description ?? ''}
                onChange={(e) => onUpdateNode(node.id, { description: e.target.value || undefined })}
                rows={3}
                placeholder="Was passiert hier? Checklisten, Links, SLAs …"
                className={cn(inputClass, 'mt-1 resize-y')}
              />
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Typ & Status" defaultOpen={false}>
            <div>
              <label className={labelClass} htmlFor="ops-node-type">
                Typ
              </label>
              <FieldSelect
                id="ops-node-type"
                value={d.nodeType}
                onChange={(e) =>
                  onUpdateNode(node.id, { nodeType: e.target.value as FlowNodeType })
                }
                wrapperClassName="mt-1"
                className="text-sm"
              >
                {catalogTypes.map((t) => (
                  <option key={t} value={t}>
                    {NODE_TYPE_LABEL_DE[t]}
                  </option>
                ))}
              </FieldSelect>
            </div>
            <div>
              <span className={labelClass}>Status (Planung / Demo)</span>
              <SegmentedControl
                aria-label="Schritt-Status"
                className="mt-1 w-full"
                layout="vertical"
                size="sm"
                value={d.status}
                onChange={(s) => onUpdateNode(node.id, { status: s })}
                options={STATUS_OPTIONS.map((s) => ({
                  value: s,
                  label: STATUS_LABEL_DE[s],
                }))}
              />
            </div>
          </CollapsibleSection>
          <button
            type="button"
            onClick={() => onDeleteNode(node.id)}
            className="w-full rounded-md border border-red-200 bg-red-50 px-2 py-2 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
          >
            Schritt löschen
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Mobil: kompakte Leiste unter dem Canvas (Inspector als Sheet-light). */
export function FlowSelectionInspectorMobileStrip({
  focus,
  nodes,
  edges,
  isDark,
  onUpdateNode,
  onUpdateEdgeLabel,
}: Props) {
  if (focus.type === 'none' || focus.type === 'multi') return null;

  if (focus.type === 'edge') {
    const edge = edges.find((e) => e.id === focus.id);
    if (!edge) return null;
    const labelVal = typeof edge.label === 'string' ? edge.label : edge.label != null ? String(edge.label) : '';
    return (
      <div
        className={cn(
          'shrink-0 border-t border-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden',
          isDark ? 'bg-zinc-950' : 'bg-white',
        )}
      >
        <label className="text-[10px] font-semibold uppercase tracking-wide text-text-light dark:text-zinc-500">
          Beschriftung Verbindung
        </label>
        <input
          type="text"
          value={labelVal}
          onChange={(e) => onUpdateEdgeLabel(edge.id, e.target.value)}
          placeholder="ja / nein …"
          className={cn(
            'mt-1 w-full rounded-md border px-2 py-1.5 text-sm',
            isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-border bg-white',
          )}
        />
      </div>
    );
  }

  const node = nodes.find((n) => n.id === focus.id);
  if (!node) return null;
  const d = nodeData(node);

  return (
    <div
      className={cn(
        'shrink-0 space-y-2 border-t border-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden',
        isDark ? 'bg-zinc-950' : 'bg-white',
      )}
    >
      <input
        type="text"
        value={d.title}
        onChange={(e) => onUpdateNode(node.id, { title: e.target.value })}
        className={cn(
          'w-full rounded-xl border px-2.5 py-2 text-sm font-medium shadow-sm',
          isDark ? 'border-zinc-700 bg-zinc-900' : 'border-border bg-white',
        )}
      />
      <CollapsibleSection title="Notiz & Status" defaultOpen={false}>
        <textarea
          value={d.description ?? ''}
          onChange={(e) => onUpdateNode(node.id, { description: e.target.value || undefined })}
          rows={2}
          placeholder="Beschreibung…"
          className={cn(
            'w-full resize-none rounded-xl border px-2.5 py-2 text-xs shadow-sm',
            isDark ? 'border-zinc-700 bg-zinc-900' : 'border-border bg-white',
          )}
        />
        <div className="-mx-0.5 overflow-x-auto pb-0.5">
          <SegmentedControl
            aria-label="Status"
            size="sm"
            className="min-w-max"
            value={d.status}
            onChange={(s) => onUpdateNode(node.id, { status: s })}
            options={STATUS_OPTIONS.map((s) => ({
              value: s,
              label: STATUS_LABEL_DE[s],
            }))}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
