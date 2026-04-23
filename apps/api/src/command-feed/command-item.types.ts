/**
 * Minimales Command-/Event-Modell (Phase A): reine API-DTOs, keine DB-Persistenz.
 * domainEvent dient als stabile Quelle für spätere Outbox / Ops Intelligence.
 */
export type CommandDomainEvent =
  | 'task.overdue'
  | 'invoice.payment_missing'
  | 'deal.at_risk';

export type CommandSuggestedAction = {
  /** Eindeutiger Schlüssel für UI-Telemetrie / Mapping */
  key: 'mark_task_done' | 'nudge_task_assignee' | 'mark_invoice_paid' | 'open_deal';
  label: string;
  /** REST-Hinweis für das Web-Frontend (bestehende Endpoints) */
  api: {
    method: 'GET' | 'PATCH' | 'POST';
    /** Pfad mit Platzhaltern :id — Client ersetzt durch entityId */
    pathTemplate: string;
    body?: Record<string, unknown>;
  };
};

export type CommandItem = {
  id: string;
  domainEvent: CommandDomainEvent;
  title: string;
  summary: string;
  /** 1 = höchste Dringlichkeit */
  severity: number;
  dueAt: string | null;
  entityType: 'task' | 'invoice' | 'deal';
  entityId: string;
  metadata?: Record<string, unknown>;
  suggestedActions: CommandSuggestedAction[];
};
