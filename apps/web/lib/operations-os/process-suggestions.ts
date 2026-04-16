import type { Flow } from '@/lib/operations-os/types';

/** Typische Phasen für operative Ablaufplanung (Vorschläge + aus bestehenden Prozessen). */
export const PHASE_SUGGESTION_PRESETS = [
  'Kickoff',
  'Planung',
  'Umsetzung',
  'Review',
  'Go-Live',
  'Hypercare',
  'Abschluss',
  'Zugang',
  'Compliance',
  'Triage',
  'Übergabe',
  'Enablement',
];

/** Häufige Tags (Vorschläge; zusätzlich kommen Werte aus allen Prozessen). */
export const TAG_SUGGESTION_PRESETS = [
  'DSGVO',
  'GoBD',
  'SLA',
  'CSM',
  'API',
  'Training',
  'Compliance',
  'KPI',
  'Handover',
  'Runbook',
  'Termin',
  'Anamnese',
  'Import',
  'E-Mail',
  'Audit',
];

function collectFromFlows(flows: Flow[], key: 'phases' | 'tags'): string[] {
  const seen = new Set<string>();
  for (const f of flows) {
    const arr = key === 'phases' ? f.phases : f.tags;
    arr?.forEach((raw) => {
      const t = raw.trim();
      if (t) seen.add(t);
    });
  }
  return Array.from(seen);
}

function mergeUniqueSorted(presets: string[], fromFlows: string[]): string[] {
  const set = new Set<string>();
  presets.forEach((p) => set.add(p.trim()));
  fromFlows.forEach((p) => set.add(p.trim()));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
}

export function buildPhaseSuggestions(flows: Flow[]): string[] {
  return mergeUniqueSorted(PHASE_SUGGESTION_PRESETS, collectFromFlows(flows, 'phases'));
}

export function buildTagSuggestions(flows: Flow[]): string[] {
  return mergeUniqueSorted(TAG_SUGGESTION_PRESETS, collectFromFlows(flows, 'tags'));
}
