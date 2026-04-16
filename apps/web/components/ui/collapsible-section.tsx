'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  title: string;
  /** Standard: aufgeklappt, für ruhigere UI oft `false`. */
  defaultOpen?: boolean;
  className?: string;
  /** Innenfläche unter der Überschrift */
  bodyClassName?: string;
  children: React.ReactNode;
};

/**
 * Einklappbarer Block — weniger visuelles Rauschen, Fokus aufs Wesentliche.
 */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  className,
  bodyClassName,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  const panelId = `${uid}-panel`;

  return (
    <div
      className={cn(
        'rounded-lg border border-border/90 bg-white/40 dark:border-zinc-800 dark:bg-zinc-900/25',
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
      >
        <span className="text-xs font-semibold text-text dark:text-zinc-200">{title}</span>
        <span
          className={cn(
            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] text-text-light transition-transform dark:text-zinc-500',
            open && 'rotate-180',
          )}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          className={cn(
            'space-y-2 border-t border-border/70 px-2.5 pb-2.5 pt-2 dark:border-zinc-800',
            bodyClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
