'use client';

import { useMemo, useState } from 'react';
import type { FlowNodeType } from '@/lib/operations-os/types';
import {
  NODE_CATALOG_GROUPS,
  NODE_TYPE_LABEL_DE,
} from '@/lib/operations-os/node-catalog';
import { cn } from '@/lib/operations-os/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (t: FlowNodeType) => void;
  hasNodes: boolean;
};

/** Rechtes Panel wie n8n „Nodes“: Suche + Kategorien. */
export function OpsOsNodeCatalogPanel({ open, onClose, onPick, hasNodes }: Props) {
  const [q, setQ] = useState('');

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return NODE_CATALOG_GROUPS;
    return NODE_CATALOG_GROUPS.map((g) => ({
      ...g,
      types: g.types.filter(
        (t) =>
          NODE_TYPE_LABEL_DE[t].toLowerCase().includes(needle) ||
          t.includes(needle) ||
          g.label.toLowerCase().includes(needle),
      ),
    })).filter((g) => g.types.length > 0);
  }, [q]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 z-[25] bg-slate-900/20 dark:bg-black/35"
        aria-label="Panel schließen"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 z-[30] flex h-full w-full max-w-sm flex-col border-l border-border bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
        role="dialog"
        aria-label="Knoten hinzufügen"
      >
        <div className="border-b border-border px-3 py-2.5 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text">Knoten</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-xs text-text-light hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Schließen
            </button>
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Knoten suchen…"
            className="mt-2 w-full rounded-md border border-border bg-light px-2.5 py-1.5 text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {!hasNodes && (
            <p className="mt-2 text-[11px] leading-snug text-text-light">
              Wie in n8n: beginne mit einem <strong>Trigger</strong>, dann weitere Schritte ziehen oder hier
              hinzufügen.
            </p>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filteredGroups.map((g) => (
            <div key={g.id} className="mb-4">
              <div className="px-1 pb-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text">
                  {g.label}
                </div>
                <div className="text-[10px] text-text-light">{g.description}</div>
              </div>
              <ul className="space-y-0.5">
                {g.types.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => onPick(t)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text hover:bg-slate-100 dark:hover:bg-zinc-800/90"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-light text-xs dark:border-zinc-600 dark:bg-zinc-900">
                        {t === 'trigger' ? '⚡' : t === 'ai' ? '✦' : '◇'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{NODE_TYPE_LABEL_DE[t]}</span>
                        <span className="block truncate text-[10px] text-text-light">{t}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
