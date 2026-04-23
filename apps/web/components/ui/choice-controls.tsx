'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Zeile oder untereinander (z. B. Statusliste im schmalen Panel). */
  layout?: 'horizontal' | 'vertical';
  /** Gleiche Breite pro Segment (sinnvoll bei 2–4 Optionen, z. B. Theme). */
  equalWidth?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
};

/**
 * Getrennte „Tabs“ / Pillen-Auswahl statt nativem `<select>` — wirkt ruhiger und konsistent in Hell/Dunkel.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  layout = 'horizontal',
  equalWidth = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const isVert = layout === 'vertical';
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'rounded-xl border border-border bg-slate-100/90 p-1 shadow-inner dark:border-zinc-700/90 dark:bg-zinc-900/55',
        isVert ? 'flex flex-col gap-0.5' : 'inline-flex flex-wrap gap-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg font-medium tracking-tight transition-all duration-150',
              pad,
              equalWidth && !isVert && 'min-w-0 flex-1',
              isVert && 'w-full justify-start',
              selected
                ? 'bg-white text-text shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-800 dark:text-zinc-50 dark:ring-white/[0.08]'
                : 'text-text-light hover:bg-white/70 hover:text-text dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200',
            )}
          >
            {opt.icon != null ? <span className="shrink-0 opacity-90">{opt.icon}</span> : null}
            <span className={cn('truncate', equalWidth && 'text-center')}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type FieldSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  wrapperClassName?: string;
};

/**
 * Native `<select>` mit klarer „Control“-Optik: Rahmen am Wrapper, Chevronschiene, `focus-within`.
 */
export function FieldSelect({ wrapperClassName, className, children, disabled, ...rest }: FieldSelectProps) {
  return (
    <div
      className={cn(
        'group flex min-h-[2.75rem] w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm ring-1 ring-black/[0.04] transition-[border-color,box-shadow,background-color]',
        'hover:border-slate-300 hover:shadow dark:border-zinc-600 dark:bg-zinc-900 dark:ring-white/[0.06] dark:hover:border-zinc-500',
        'focus-within:border-primary focus-within:shadow-md focus-within:ring-[3px] focus-within:ring-primary/18 dark:focus-within:ring-primary/22',
        disabled && 'pointer-events-none opacity-55',
        wrapperClassName,
      )}
    >
      <select
        disabled={disabled}
        className={cn(
          'min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent py-2.5 pl-3.5 pr-2 text-[15px] font-medium leading-snug tracking-tight text-text antialiased outline-none sm:text-sm',
          'disabled:cursor-not-allowed',
          'dark:text-zinc-100',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none flex shrink-0 items-center border-l border-border/75 bg-gradient-to-b from-slate-50 to-slate-100/95 px-2.5 text-text-light dark:border-zinc-600 dark:from-zinc-800 dark:to-zinc-900/95 dark:text-zinc-400',
          'group-hover:border-slate-300/90 dark:group-hover:border-zinc-500',
        )}
      >
        <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
