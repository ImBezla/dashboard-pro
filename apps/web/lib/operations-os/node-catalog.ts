import type { FlowNodeType } from '@/lib/operations-os/types';

/** Anzeigenamen (n8n-orientiert, deutsch). */
export const NODE_TYPE_LABEL_DE: Record<FlowNodeType, string> = {
  trigger: 'Trigger',
  input: 'Eingabe',
  decision: 'Verzweigung',
  action: 'Aktion',
  delay: 'Warten',
  review: 'Review',
  approval: 'Freigabe',
  publish: 'Veröffentlichen',
  notify: 'Benachrichtigen',
  document: 'Dokument',
  manual: 'Manuell',
  ai: 'KI',
  external: 'Extern',
};

/**
 * Kategorien wie in n8n: zuerst Trigger, dann Gruppen für Schritte.
 * @see https://docs.n8n.io/courses/level-one/chapter-1 (Node panel / Kategorien)
 */
export const NODE_CATALOG_GROUPS: {
  id: string;
  label: string;
  description: string;
  types: FlowNodeType[];
}[] = [
  {
    id: 'triggers',
    label: 'Trigger',
    description: 'Startet den Workflow',
    types: ['trigger'],
  },
  {
    id: 'actions',
    label: 'Aktionen',
    description: 'Daten verarbeiten, senden, speichern',
    types: ['action', 'input', 'publish', 'notify', 'external'],
  },
  {
    id: 'flow',
    label: 'Ablauf & Daten',
    description: 'Warten, Dokumente, Verzweigungen',
    types: ['delay', 'document', 'decision'],
  },
  {
    id: 'human',
    label: 'Menschliche Schritte',
    description: 'Review, Freigabe, manuelle Aufgabe',
    types: ['review', 'approval', 'manual'],
  },
  {
    id: 'ai',
    label: 'KI',
    description: 'KI-gestützte Schritte',
    types: ['ai'],
  },
];

export function flattenCatalogTypes(): FlowNodeType[] {
  const seen = new Set<FlowNodeType>();
  const out: FlowNodeType[] = [];
  for (const g of NODE_CATALOG_GROUPS) {
    for (const t of g.types) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
  }
  return out;
}
