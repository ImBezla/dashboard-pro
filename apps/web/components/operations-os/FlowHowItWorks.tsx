'use client';

import { cn } from '@/lib/cn';

type Props = {
  className?: string;
};

/**
 * Kurze Orientierung für Flow (Galerie + Editor) — per <details> auf Wunsch aufklappbar.
 */
export function FlowHowItWorks({ className }: Props) {
  return (
    <details
      className={cn(
        'rounded-lg border border-border/80 bg-zinc-50/80 text-left dark:border-zinc-700 dark:bg-zinc-900/40',
        className,
      )}
    >
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-text outline-none marker:hidden dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>ⓘ</span>
          So funktioniert&apos;s
        </span>
      </summary>
      <ul className="space-y-1.5 border-t border-border/60 px-3 py-2.5 text-[11px] leading-snug text-text-light dark:border-zinc-700 dark:text-zinc-400">
        <li>
          <span className="font-medium text-text dark:text-zinc-300">Galerie:</span> Prozesse
          durchstöbern, öffnen oder mit „Zum Editor“ bearbeiten.
        </li>
        <li>
          <span className="font-medium text-text dark:text-zinc-300">Editor:</span> Knoten aus
          der Palette setzen, mit Ziehen verbinden, verschieben.
        </li>
        <li>
          <span className="font-medium text-text dark:text-zinc-300">Speichern:</span> Nur bei
          eigenen Prozessen — lokal im Browser (nicht auf dem Server).
        </li>
        <li>
          <span className="font-medium text-text dark:text-zinc-300">Neu:</span> „+ Neuer
          Prozess“ — Titel und Kontext im Dialog, dann im Editor weiterbauen.
        </li>
      </ul>
    </details>
  );
}
