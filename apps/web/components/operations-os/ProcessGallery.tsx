'use client';

import type { Flow, OperationalDomain } from '@/lib/operations-os/types';
import { isUserOwnedFlow } from '@/lib/operations-os/use-ops-process-store';
import { cn } from '@/lib/cn';

const DOMAIN_LABEL: Record<OperationalDomain, string> = {
  healthcare: 'Gesundheit / Patient',
  customer_success: 'Kunde & Onboarding',
  internal: 'Intern',
  generic: 'Allgemein',
};

type Props = {
  flows: Flow[];
  stepCounts: Record<string, number>;
  onOpenFlow: (id: string) => void;
  onNewProcess: () => void;
  onEditMeta: (id: string) => void;
  onRemoveFlow: (id: string) => void;
  onGoEditor: () => void;
  hiddenDemoCount: number;
  onRestoreDemos: () => void;
};

export function ProcessGallery({
  flows,
  stepCounts,
  onOpenFlow,
  onNewProcess,
  onEditMeta,
  onRemoveFlow,
  onGoEditor,
  hiddenDemoCount,
  onRestoreDemos,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-3 py-3 sm:px-0 sm:py-4 dark:border-zinc-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text dark:text-zinc-100">Flow</h1>
            <p className="mt-0.5 text-sm text-text-light dark:text-zinc-400">
              Alle Abläufe auf einen Blick — öffnen, anpassen oder aus der Liste nehmen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGoEditor}
              className="min-h-[44px] touch-manipulation rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 sm:min-h-0 sm:py-2"
            >
              Zum Editor
            </button>
            <button
              type="button"
              onClick={onNewProcess}
              className="min-h-[44px] touch-manipulation rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:min-h-0 sm:py-2"
            >
              + Neuer Prozess
            </button>
          </div>
        </div>
        {hiddenDemoCount > 0 ? (
          <button
            type="button"
            onClick={onRestoreDemos}
            className="mt-3 text-left text-xs font-medium text-primary hover:underline"
          >
            {hiddenDemoCount} Demo-Prozess(e) wieder anzeigen
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-0 sm:py-6 sm:pb-6">
        {flows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-white/50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
            <p className="text-sm text-text-light dark:text-zinc-400">Noch keine Prozesse in der Liste.</p>
            <button
              type="button"
              onClick={onNewProcess}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Ersten Prozess anlegen
            </button>
          </div>
        ) : (
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flows.map((f) => {
              const domain = f.domain ?? 'generic';
              const own = isUserOwnedFlow(f.id);
              const steps = stepCounts[f.id] ?? 0;
              return (
                <li
                  key={f.id}
                  className={cn(
                    'flex flex-col rounded-2xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-950',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-text dark:text-zinc-100">
                      {f.title}
                    </h2>
                    <span className="shrink-0 rounded-full border border-border bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-text-light dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      {DOMAIN_LABEL[domain]}
                    </span>
                  </div>
                  {f.description ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-light dark:text-zinc-400">
                      {f.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm italic text-text-light dark:text-zinc-500">Keine Kurzbeschreibung</p>
                  )}
                  <p className="mt-3 text-xs text-text-light dark:text-zinc-500">
                    {steps} Schritt{steps === 1 ? '' : 'e'}
                    {own ? ' · eigen' : ' · Vorlage'}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => onOpenFlow(f.id)}
                      className="min-h-[44px] flex-1 touch-manipulation rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:min-h-0"
                    >
                      Öffnen
                    </button>
                    {own ? (
                      <button
                        type="button"
                        onClick={() => onEditMeta(f.id)}
                        className="min-h-[44px] touch-manipulation rounded-xl border border-border py-2.5 text-sm font-semibold text-text hover:bg-slate-50 dark:border-zinc-600 dark:hover:bg-zinc-800 sm:min-h-0 sm:px-4"
                      >
                        Bearbeiten
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        const msg = own
                          ? 'Diesen eigenen Prozess inkl. Ablauf endgültig löschen?'
                          : 'Diesen Demo-Prozess aus deiner Liste ausblenden? (Daten bleiben im Projekt, du kannst ihn später wiederherstellen.)';
                        if (confirm(msg)) onRemoveFlow(f.id);
                      }}
                      className="min-h-[44px] touch-manipulation rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 sm:min-h-0 sm:px-4"
                    >
                      {own ? 'Löschen' : 'Ausblenden'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
