'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTENT_OPS_SUBNAV } from '@/lib/content-ops/nav-links';
import { cn } from '@/lib/content-ops/cn';

export function ContentOpsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
      <div className="border-b border-zinc-800 px-2 py-2 sm:px-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Content Operations · Instagram
        </p>
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Content Operations">
          {CONTENT_OPS_SUBNAV.map((item) => {
            const active =
              item.href === '/content-operations'
                ? pathname === '/content-operations'
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
