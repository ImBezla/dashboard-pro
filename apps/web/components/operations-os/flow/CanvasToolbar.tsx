'use client';

import { Panel, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/operations-os/cn';

type Props = {
  catalogOpen: boolean;
  onToggleCatalog: () => void;
  executing: boolean;
  onExecute: () => void;
  onTidy: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  processFullscreen: boolean;
  onToggleProcessFullscreen: () => void;
};

/** Oben rechts auf der Fläche — angelehnt an n8n (Zoom, +, Ausführen, Aufräumen). */
export function OpsOsCanvasToolbar({
  catalogOpen,
  onToggleCatalog,
  executing,
  onExecute,
  onTidy,
  inspectorOpen,
  onToggleInspector,
  processFullscreen,
  onToggleProcessFullscreen,
}: Props) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel
      position="top-right"
      className="mr-2 mt-[max(0.35rem,env(safe-area-inset-top))] flex flex-col gap-1.5 sm:m-2"
    >
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-white/95 p-1 shadow-md backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
        <button
          type="button"
          title="Knoten hinzufügen (wie n8n +)"
          onClick={onToggleCatalog}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-md text-lg font-light leading-none transition-colors sm:h-9 sm:w-9',
            catalogOpen
              ? 'bg-primary text-white'
              : 'text-text hover:bg-slate-100 dark:hover:bg-zinc-800',
          )}
        >
          +
        </button>
        <div className="my-0.5 border-t border-border dark:border-zinc-700" />
        <button
          type="button"
          title="Hineinzoomen"
          onClick={() => zoomIn({ duration: 200 })}
          className="flex h-11 w-11 items-center justify-center rounded-md text-xs font-semibold text-text hover:bg-slate-100 dark:hover:bg-zinc-800 sm:h-9 sm:w-9"
        >
          +
        </button>
        <button
          type="button"
          title="Herauszoomen"
          onClick={() => zoomOut({ duration: 200 })}
          className="flex h-11 w-11 items-center justify-center rounded-md text-xs font-semibold text-text hover:bg-slate-100 dark:hover:bg-zinc-800 sm:h-9 sm:w-9"
        >
          −
        </button>
        <button
          type="button"
          title="Alles einpassen"
          onClick={() => fitView({ padding: 0.2, duration: 260 })}
          className="flex h-11 w-11 items-center justify-center rounded-md text-[10px] font-semibold text-text hover:bg-slate-100 dark:hover:bg-zinc-800 sm:h-9 sm:w-9"
        >
          ⊡
        </button>
        <div className="my-0.5 border-t border-border dark:border-zinc-700" />
        <button
          type="button"
          title="Knoten horizontal anordnen"
          onClick={onTidy}
          className="flex h-11 w-11 items-center justify-center rounded-md text-xs text-text hover:bg-slate-100 dark:hover:bg-zinc-800 sm:h-9 sm:w-9"
        >
          ≡
        </button>
        <div className="my-0.5 border-t border-border dark:border-zinc-700" />
        <button
          type="button"
          title={inspectorOpen ? 'Bearbeiten-Panel ausblenden' : 'Bearbeiten-Panel einblenden'}
          onClick={onToggleInspector}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-md text-xs font-semibold transition-colors sm:h-9 sm:w-9',
            inspectorOpen
              ? 'text-text hover:bg-slate-100 dark:hover:bg-zinc-800'
              : 'bg-primary/10 text-primary dark:bg-primary/20',
          )}
        >
          ⧉
        </button>
        <div className="my-0.5 border-t border-border dark:border-zinc-700" />
        <button
          type="button"
          title={processFullscreen ? 'Vollbild verlassen' : 'Prozess-Canvas im Vollbild'}
          onClick={onToggleProcessFullscreen}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-md text-[10px] font-semibold transition-colors sm:h-9 sm:w-9',
            processFullscreen
              ? 'bg-primary text-white'
              : 'text-text hover:bg-slate-100 dark:hover:bg-zinc-800',
          )}
        >
          ⛶
        </button>
      </div>
      <button
        type="button"
        title="Workflow ausführen (Demo)"
        disabled={executing}
        onClick={onExecute}
        className={cn(
          'min-h-[44px] rounded-lg px-3 py-2.5 text-xs font-semibold shadow-md transition-colors sm:min-h-0 sm:py-2',
          executing
            ? 'cursor-wait bg-emerald-800/80 text-white'
            : 'bg-emerald-600 text-white hover:bg-emerald-700',
        )}
      >
        {executing ? '… läuft' : '▶ Ausführen'}
      </button>
    </Panel>
  );
}
