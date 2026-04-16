import { ALL_MODULE_KEYS, type ModuleKey } from '../common/module-packs';

/** Antworten aus dem Onboarding-Fragekatalog (Schlüssel stabil für API/Web). */
export const FOCUS_AREA_IDS = [
  'team_projects',
  'customers_sales',
  'procurement',
  'finance_controlling',
  'reporting_insights',
] as const;

export type FocusAreaId = (typeof FOCUS_AREA_IDS)[number];

export function isFocusAreaId(v: string): v is FocusAreaId {
  return (FOCUS_AREA_IDS as readonly string[]).includes(v);
}

export const INDUSTRY_IDS = [
  'it_agency',
  'trade',
  'production',
  'services',
  'public',
  'other',
] as const;

export type IndustryId = (typeof INDUSTRY_IDS)[number];

export function isIndustryId(v: string): v is IndustryId {
  return (INDUSTRY_IDS as readonly string[]).includes(v);
}

export const TEAM_SIZE_IDS = ['1-5', '6-20', '21-50', '51+'] as const;

export type TeamSizeId = (typeof TEAM_SIZE_IDS)[number];

export function isTeamSizeId(v: string): v is TeamSizeId {
  return (TEAM_SIZE_IDS as readonly string[]).includes(v);
}

/** Immer sinnvolle Basis – auch wenn Nutzer wenig ankreuzt. */
const BASE_MODULES: ModuleKey[] = [
  'overview',
  'notifications',
  'team',
  'calendar',
  'security',
  'settings',
  'help',
];

const FOCUS_TO_MODULES: Record<FocusAreaId, ModuleKey[]> = {
  team_projects: ['projects', 'tasks', 'analytics'],
  customers_sales: ['customers', 'products', 'invoices', 'suppliers'],
  procurement: ['purchasing', 'suppliers', 'products'],
  finance_controlling: ['finance', 'invoices', 'reports'],
  reporting_insights: ['reports', 'analytics'],
};

export function suggestModulesFromFocusAreas(
  focusAreas: string[],
): ModuleKey[] {
  const set = new Set<ModuleKey>(BASE_MODULES);
  for (const id of focusAreas) {
    if (!isFocusAreaId(id)) continue;
    for (const m of FOCUS_TO_MODULES[id]) {
      set.add(m);
    }
  }
  return ALL_MODULE_KEYS.filter((k) => set.has(k));
}

export function suggestModulesFromQuestionnaireInput(
  focusAreas: string[],
  opts?: { industry?: string; teamSize?: string },
): ModuleKey[] {
  const set = new Set<ModuleKey>(suggestModulesFromFocusAreas(focusAreas));

  const ind = opts?.industry;
  if (ind && isIndustryId(ind)) {
    if (ind === 'trade' || ind === 'production') {
      set.add('products');
      set.add('customers');
      set.add('suppliers');
    }
    if (ind === 'production') {
      set.add('purchasing');
    }
    if (ind === 'it_agency' || ind === 'services') {
      set.add('projects');
      set.add('tasks');
    }
    if (ind === 'public') {
      set.add('finance');
      set.add('reports');
    }
  }

  const team = opts?.teamSize;
  if (team && isTeamSizeId(team)) {
    if (team === '21-50' || team === '51+') {
      set.add('analytics');
      set.add('reports');
    }
  }

  return ALL_MODULE_KEYS.filter((k) => set.has(k));
}
