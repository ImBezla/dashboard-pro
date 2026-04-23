/**
 * Modul-Schlüssel müssen mit der API (`module-packs`) übereinstimmen.
 * `always`: immer anzeigen (kein Pack-Filter).
 * Navigationstexte: `labelKey` / `sectionKey` → `useTranslation()` (lib/i18n).
 */
export type NavModuleKey =
  | 'overview'
  | 'analytics'
  | 'notifications'
  | 'team'
  | 'projects'
  | 'tasks'
  | 'calendar'
  | 'finance'
  | 'invoices'
  | 'products'
  | 'purchasing'
  | 'customers'
  | 'suppliers'
  | 'reports'
  | 'security'
  | 'settings'
  | 'help';

/** i18n-Schlüssel pro Modul (Einstellungen, Badges, …). */
export const NAV_MODULE_LABEL_KEYS: Record<NavModuleKey, string> = {
  overview: 'nav.dashboard',
  analytics: 'nav.analytics',
  notifications: 'nav.notifications',
  team: 'nav.team',
  projects: 'nav.projects',
  tasks: 'nav.tasks',
  calendar: 'nav.calendar',
  finance: 'nav.finance',
  invoices: 'nav.invoices',
  products: 'nav.products',
  purchasing: 'nav.purchasing',
  customers: 'nav.customers',
  suppliers: 'nav.suppliers',
  reports: 'nav.reports',
  security: 'nav.security',
  settings: 'nav.settings',
  help: 'nav.help',
};

export type SidebarNavItem = {
  href: string;
  labelKey: string;
  icon: string;
  hasBadge?: boolean;
  moduleKey?: NavModuleKey;
  always?: boolean;
  /** Aktiv bei Unterpfaden (z. B. /flow/…). */
  matchChildren?: boolean;
};

export type SidebarNavSection = {
  sectionKey: string;
  items: SidebarNavItem[];
};

export const SIDEBAR_NAV_SECTIONS: SidebarNavSection[] = [
  {
    sectionKey: 'nav.section.overview',
    items: [
      { href: '/dashboard', labelKey: 'nav.dashboard', icon: '📊', moduleKey: 'overview' },
      { href: '/analytics', labelKey: 'nav.analytics', icon: '📈', moduleKey: 'analytics' },
      {
        href: '/notifications',
        labelKey: 'nav.notifications',
        icon: '🔔',
        hasBadge: true,
        moduleKey: 'notifications',
      },
      {
        href: '/command-feed',
        labelKey: 'nav.command_feed',
        icon: '⚡',
        always: true,
      },
      {
        href: '/deals',
        labelKey: 'nav.deals',
        icon: '🎯',
        always: true,
      },
    ],
  },
  {
    sectionKey: 'nav.section.management',
    items: [
      { href: '/team', labelKey: 'nav.team', icon: '👥', moduleKey: 'team' },
      { href: '/projects', labelKey: 'nav.projects', icon: '📁', moduleKey: 'projects' },
      { href: '/tasks', labelKey: 'nav.tasks', icon: '✓', moduleKey: 'tasks' },
      { href: '/calendar', labelKey: 'nav.calendar', icon: '📅', moduleKey: 'calendar' },
    ],
  },
  {
    sectionKey: 'nav.section.flow',
    items: [
      {
        href: '/flow',
        labelKey: 'nav.flow',
        icon: '〰',
        always: true,
        matchChildren: true,
      },
    ],
  },
  {
    sectionKey: 'nav.section.business',
    items: [
      { href: '/finance', labelKey: 'nav.finance', icon: '💰', moduleKey: 'finance' },
      { href: '/invoices', labelKey: 'nav.invoices', icon: '📄', moduleKey: 'invoices' },
      { href: '/products', labelKey: 'nav.products', icon: '📦', moduleKey: 'products' },
      { href: '/purchasing', labelKey: 'nav.purchasing', icon: '🛒', moduleKey: 'purchasing' },
      { href: '/customers', labelKey: 'nav.customers', icon: '🤝', moduleKey: 'customers' },
      { href: '/suppliers', labelKey: 'nav.suppliers', icon: '🏭', moduleKey: 'suppliers' },
      { href: '/reports', labelKey: 'nav.reports', icon: '📊', moduleKey: 'reports' },
    ],
  },
  {
    sectionKey: 'nav.section.system',
    items: [
      { href: '/settings', labelKey: 'nav.settings', icon: '⚙️', always: true },
      { href: '/security', labelKey: 'nav.security', icon: '🔒', moduleKey: 'security' },
      { href: '/help', labelKey: 'nav.help', icon: '❓', always: true },
    ],
  },
];

export function isNavItemVisible(
  item: SidebarNavItem,
  enabledModules: string[] | null | undefined,
): boolean {
  if (item.always) return true;
  if (!item.moduleKey) return true;
  if (!enabledModules || enabledModules.length === 0) return true;
  return enabledModules.includes(item.moduleKey);
}
