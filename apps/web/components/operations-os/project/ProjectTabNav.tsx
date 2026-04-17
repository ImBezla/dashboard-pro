'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/operations-os/cn';

const tabs = (projectId: string) =>
  [
    { href: `/operations-os/projects/${projectId}/overview`, label: 'Übersicht' },
    { href: `/operations-os/projects/${projectId}/documents`, label: 'Dokumente' },
    { href: `/operations-os/projects/${projectId}/tasks`, label: 'Tasks' },
    { href: `/operations-os/projects/${projectId}/flow`, label: 'Flow' },
    { href: `/operations-os/projects/${projectId}/timeline`, label: 'Timeline' },
    { href: `/operations-os/projects/${projectId}/logs`, label: 'Logs' },
    { href: `/operations-os/projects/${projectId}/notes`, label: 'Notizen' },
    { href: `/operations-os/projects/${projectId}/resources`, label: 'Ressourcen' },
  ] as const;

export function OpsOsProjectTabNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-zinc-800 pb-2" aria-label="Projekt">
      {tabs(projectId).map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}?`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
