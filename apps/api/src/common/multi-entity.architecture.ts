/**
 * Architektur-Entscheidung Multi-Entity / Holding (Roadmap Punkt 8) — Optionen
 * und Empfehlung für die nächste Ausbaustufe. Kein Laufzeit-Code.
 */

export const MULTI_ENTITY_OPTIONS = {
  /** Eine Organisation als Konzern-Root; juristische Einheiten als Kind-Entität. */
  legalEntityChildren: {
    summary:
      'Alle Belege (Rechnungen, POs) tragen legalEntityId; Reporting konsolidiert per Org-Baum.',
    pros: [
      'Eine AuthZ-Basis (Org-Mitgliedschaft)',
      'Einfacheres RLS-Modell in Postgres',
    ],
    cons: [
      'Migration bestehender Daten auf legalEntityId',
      'UI muss Entity-Switch explizit führen',
    ],
  },
  /** Mehrere Organisationen mit Vertrauens-/Holding-Verknüpfung und Federation. */
  linkedOrganizations: {
    summary:
      'Intercompany als explizite Belege zwischen Orgs; Konsolidierung über Graph-Service.',
    pros: [
      'Strikte Datenisolierung pro Firma',
      'Passt zu Mandanten-fähigem SaaS',
    ],
    cons: [
      'Komplexere AuthZ und Cross-Org-Queries',
      'Portale brauchen klare „in welcher Org bin ich?“-UX',
    ],
  },
} as const;

/**
 * Empfehlung für DashboardPro heute: zuerst {@link MULTI_ENTITY_OPTIONS.legalEntityChildren}
 * evaluieren, sobald Intercompany oder konsolidierte KPIs Pflicht werden — bis dahin
 * genügt `Organization.kind` + optionale Metadaten in `Organization.settings`.
 */
export const MULTI_ENTITY_RECOMMENDED_NEXT_STEP =
  'Workshop: Pflichtfelder pro Beleg (Steuernummer, LEI), Reporting-Ziele, Trennung Portal vs. intern.';
