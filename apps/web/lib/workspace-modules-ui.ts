/**
 * UI-Metadaten für Workspace-Module (Schlüssel = API module-packs).
 */

import type { NavModuleKey } from './module-nav';

export type FocusAreaId =
  | 'team_projects'
  | 'customers_sales'
  | 'procurement'
  | 'finance_controlling'
  | 'reporting_insights';

export type IndustryId =
  | 'it_agency'
  | 'trade'
  | 'production'
  | 'services'
  | 'public'
  | 'other';

export type TeamSizeId = '1-5' | '6-20' | '21-50' | '51+';

export const INDUSTRY_OPTIONS: {
  id: IndustryId;
  label: string;
}[] = [
  { id: 'it_agency', label: 'IT, Software, Agentur' },
  { id: 'trade', label: 'Handel & Vertrieb' },
  { id: 'production', label: 'Produktion & Fertigung' },
  { id: 'services', label: 'Dienstleistungen & Beratung' },
  { id: 'public', label: 'Öffentlicher Sektor / Nonprofit' },
  { id: 'other', label: 'Sonstiges' },
];

export const TEAM_SIZE_OPTIONS: { id: TeamSizeId; label: string }[] = [
  { id: '1-5', label: '1–5 Personen' },
  { id: '6-20', label: '6–20 Personen' },
  { id: '21-50', label: '21–50 Personen' },
  { id: '51+', label: '51+ Personen' },
];

export const FOCUS_OPTIONS: {
  id: FocusAreaId;
  title: string;
  description: string;
}[] = [
  {
    id: 'team_projects',
    title: 'Team & Projekte',
    description:
      'Interne Zusammenarbeit: Projekte, Aufgaben, Termine, Auslastung.',
  },
  {
    id: 'customers_sales',
    title: 'Kunden & Vertrieb',
    description: 'Kontakte, Angebote, Produkte, Rechnungen, Lieferanten.',
  },
  {
    id: 'procurement',
    title: 'Einkauf & Beschaffung',
    description: 'Bestellungen, Lieferanten, Artikelstamm.',
  },
  {
    id: 'finance_controlling',
    title: 'Finanzen',
    description: 'Überblick, Rechnungen, Kennzahlen.',
  },
  {
    id: 'reporting_insights',
    title: 'Berichte & Auswertungen',
    description: 'Reports, Analytics, Exporte.',
  },
];

export const MODULE_GROUPS: {
  /** i18n-Schlüssel (siehe `messages.ts` → `settings.modulesPicker.*`) */
  titleKey: string;
  keys: NavModuleKey[];
}[] = [
  {
    titleKey: 'settings.modulesPicker.groupOverview',
    keys: ['overview', 'analytics', 'notifications'],
  },
  {
    titleKey: 'settings.modulesPicker.groupWork',
    keys: ['team', 'projects', 'tasks', 'calendar'],
  },
  {
    titleKey: 'settings.modulesPicker.groupBusiness',
    keys: [
      'finance',
      'invoices',
      'products',
      'purchasing',
      'customers',
      'suppliers',
      'reports',
    ],
  },
  {
    titleKey: 'settings.modulesPicker.groupOrganization',
    keys: ['security'],
  },
];

export const MODULE_LABELS: Record<NavModuleKey, string> = {
  overview: 'Dashboard',
  analytics: 'Analytics',
  notifications: 'Benachrichtigungen',
  team: 'Team',
  projects: 'Projekte',
  tasks: 'Aufgaben',
  calendar: 'Termine',
  finance: 'Finanzen',
  invoices: 'Rechnungen',
  products: 'Produkte',
  purchasing: 'Einkauf',
  customers: 'Kunden',
  suppliers: 'Lieferanten',
  reports: 'Berichte',
  security: 'Sicherheit',
  settings: 'Einstellungen',
  help: 'Hilfe',
};

/** Entspricht den API-Paketen (Kern / Vertrieb / Komplett). */
export const PACK_PRESET_MODULES: Record<'core' | 'sales' | 'full', NavModuleKey[]> = {
  core: [
    'overview',
    'analytics',
    'notifications',
    'team',
    'projects',
    'tasks',
    'calendar',
    'security',
    'settings',
    'help',
  ],
  sales: [
    'overview',
    'analytics',
    'notifications',
    'finance',
    'invoices',
    'products',
    'purchasing',
    'customers',
    'suppliers',
    'reports',
    'security',
    'settings',
    'help',
  ],
  full: [
    'overview',
    'analytics',
    'notifications',
    'team',
    'projects',
    'tasks',
    'calendar',
    'finance',
    'invoices',
    'products',
    'purchasing',
    'customers',
    'suppliers',
    'reports',
    'security',
    'settings',
    'help',
  ],
};
