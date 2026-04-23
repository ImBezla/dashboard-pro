import type { DealMilestone } from '@prisma/client';

type MilestoneLike = Pick<DealMilestone, 'status' | 'dueDate'>;

/** Heuristik 0–100: überfällige Meilensteine, Blocker, niedrige Wahrscheinlichkeit. */
export function computeDealRiskScore(
  milestones: MilestoneLike[],
  probability: number,
  now: Date,
): number {
  let score = 0;
  for (const m of milestones) {
    if (m.status === 'BLOCKED') score += 25;
    if (
      m.status !== 'DONE' &&
      m.dueDate &&
      new Date(m.dueDate).getTime() < now.getTime()
    ) {
      score += 30;
    }
  }
  const p = Math.min(100, Math.max(0, probability));
  score += Math.round((100 - p) * 0.25);
  return Math.min(100, score);
}

export function hasOverdueOpenMilestone(
  milestones: MilestoneLike[],
  now: Date,
): boolean {
  return milestones.some(
    (m) =>
      m.status !== 'DONE' &&
      m.dueDate &&
      new Date(m.dueDate).getTime() < now.getTime(),
  );
}
