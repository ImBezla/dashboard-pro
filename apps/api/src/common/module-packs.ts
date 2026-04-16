/** Modul-Schlüssel für Sidebar / Feature-Gates (müssen mit Web-Sidebar übereinstimmen). */
export const MODULE_KEYS = [
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
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const ALL_MODULE_KEYS: ModuleKey[] = [...MODULE_KEYS];

export type PackId = 'full' | 'core' | 'sales';

export const MODULE_PACKS: Record<
  PackId,
  { label: string; description: string; modules: ModuleKey[] }
> = {
  full: {
    label: 'Komplett',
    description: 'Alle Bereiche – Standard für bestehende Mandanten.',
    modules: [...ALL_MODULE_KEYS],
  },
  core: {
    label: 'Kern',
    description: 'Übersicht, Team, Projekte, Aufgaben, Termine.',
    modules: [
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
  },
  sales: {
    label: 'Vertrieb & Einkauf',
    description:
      'Kunden, Lieferanten, Produkte, Rechnungen, Einkauf, Berichte.',
    modules: [
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
  },
};

export function isPackId(v: string): v is PackId {
  return v === 'full' || v === 'core' || v === 'sales';
}

export function modulesForPack(packId: PackId): ModuleKey[] {
  return [...MODULE_PACKS[packId].modules];
}
