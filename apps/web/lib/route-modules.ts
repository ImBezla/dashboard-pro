import type { NavModuleKey } from '@/lib/module-nav';

/** Erste passende Prefix-Regel gewinnt. */
const RULES: { prefix: string; module: NavModuleKey }[] = [
  { prefix: '/dashboard', module: 'overview' },
  { prefix: '/analytics', module: 'analytics' },
  { prefix: '/notifications', module: 'notifications' },
  { prefix: '/team', module: 'team' },
  { prefix: '/projects', module: 'projects' },
  { prefix: '/tasks', module: 'tasks' },
  { prefix: '/calendar', module: 'calendar' },
  { prefix: '/finance', module: 'finance' },
  { prefix: '/invoices', module: 'invoices' },
  { prefix: '/products', module: 'products' },
  { prefix: '/purchasing', module: 'purchasing' },
  { prefix: '/customers', module: 'customers' },
  { prefix: '/suppliers', module: 'suppliers' },
  { prefix: '/reports', module: 'reports' },
  { prefix: '/security', module: 'security' },
  { prefix: '/settings', module: 'settings' },
  { prefix: '/help', module: 'help' },
  { prefix: '/onboarding', module: 'overview' },
];

export function requiredModuleForPath(pathname: string): NavModuleKey | null {
  for (const { prefix, module } of RULES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return module;
    }
  }
  return null;
}

export function isPathAllowedByModules(
  pathname: string,
  enabledModules: string[] | null | undefined,
): boolean {
  const mod = requiredModuleForPath(pathname);
  if (!mod) return true;
  if (!enabledModules || enabledModules.length === 0) return true;
  return enabledModules.includes(mod);
}
