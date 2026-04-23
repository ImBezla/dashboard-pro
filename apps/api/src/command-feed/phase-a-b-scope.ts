/**
 * Phase A+B Produkt-Slice (Roadmap) — festgelegter MVP-Umfang.
 * Kein separates Plan-Dokument; Scope lebt im Code für Reviews/CI.
 */
export const PHASE_A_B_SCOPE = {
  phaseA: {
    name: 'Command Feed MVP',
    includes: [
      'Aggregierte Command-Items aus Tasks, Rechnungen, Deals (materialisiert, keine Outbox)',
      'Prioritäts-Sortierung über severity + dueAt',
      'Vorschläge für One-Click: Task-Status, Rechnungs-Status, Erinnerung (Nudge)',
    ],
    excludes: [
      'Persistente CommandItem-Tabelle',
      'Message-Queue / Outbox-Pattern',
    ],
  },
  phaseB: {
    name: 'Deal Execution MVP',
    includes: [
      'Deal + DealMilestone (CRUD, org-scoped)',
      'Risiko-Heuristik serverseitig (Milestone-Verzug, Wahrscheinlichkeit)',
      'Verknüpfung: Kunde, optional Projekt/Rechnung',
      'Deal-Room UI: Übersicht, Meilensteine, verknüpfte Entitäten',
    ],
    excludes: [
      'Thread-/Decision-Modell (Phase D)',
      'Vertrags-Engine (Phase E)',
    ],
  },
} as const;
