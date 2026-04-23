import type { CommandItem } from './command-item.types';

/**
 * Prioritäts-Engine v1: numerischer Score (höher = zuerst).
 * Regeln:
 * - severity (1–5) wiegt am stärksten
 * - näheres dueAt (überfällig oder heute) erhöht den Score
 * - domainEvent-Reihenfolge als Feinjustierung
 */
const EVENT_ORDER: Record<string, number> = {
  'task.overdue': 3,
  'invoice.payment_missing': 2,
  'deal.at_risk': 1,
};

export function commandPriorityScore(item: CommandItem, now: Date): number {
  const sev = Math.min(5, Math.max(1, item.severity));
  let dueBoost = 0;
  if (item.dueAt) {
    const d = new Date(item.dueAt);
    const diffH = (now.getTime() - d.getTime()) / (3600 * 1000);
    if (diffH >= 0) dueBoost = Math.min(48, 12 + diffH / 6);
    else if (diffH > -24) dueBoost = 6;
  }
  const tie = EVENT_ORDER[item.domainEvent] ?? 0;
  return sev * 1000 + dueBoost * 10 + tie;
}

export function sortCommandItems(items: CommandItem[], now = new Date()): CommandItem[] {
  return [...items].sort(
    (a, b) => commandPriorityScore(b, now) - commandPriorityScore(a, now),
  );
}
