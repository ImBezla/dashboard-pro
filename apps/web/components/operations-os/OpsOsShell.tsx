'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/operations-os/cn';

const OPS_NAV: { href: string; label: string }[] = [
  { href: '/operations-os', label: 'Übersicht' },
  { href: '/operations-os/analytics', label: 'Analytics' },
  { href: '/operations-os/projects', label: 'Projekte' },
  { href: '/operations-os/flows', label: 'Flows' },
  { href: '/operations-os/documents', label: 'Dokumente' },
  { href: '/operations-os/tasks', label: 'Tasks' },
  { href: '/operations-os/logs', label: 'Logs' },
  { href: '/operations-os/automations', label: 'Automations' },
  { href: '/operations-os/publishing', label: 'Publishing' },
  { href: '/operations-os/moderation', label: 'Moderation' },
  { href: '/operations-os/settings', label: 'Einstellungen' },
];

export function OpsOsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
      <div className="border-b border-zinc-800 px-2 py-2 sm:px-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Operations OS
        </p>
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Operations OS">
          {OPS_NAV.map((item) => {
            const active =
              item.href === '/operations-os'
                ? pathname === '/operations-os'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
