'use client';

import Link from 'next/link';

/** Links oben auf Auth-Seiten — zurück zur öffentlichen Startseite. */
export function AuthBackToSiteLink() {
  return (
    <Link
      href="/"
      className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label="Zurück zur Startseite"
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      Zurück
    </Link>
  );
}
