'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { cn } from '@/lib/content-ops/cn';

export function CoDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClassName = 'max-w-md',
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        aria-label="Schließen"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <aside
        className={cn(
          'relative z-10 flex h-full w-full flex-col border-l border-zinc-700 bg-zinc-950 shadow-2xl',
          widthClassName,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-700 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-zinc-100">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-zinc-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-transparent p-1 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
            aria-label="Schließen"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 text-sm text-zinc-200">{children}</div>
      </aside>
    </div>
  );
}
