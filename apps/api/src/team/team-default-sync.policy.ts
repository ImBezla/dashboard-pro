/**
 * Entscheidet, ob vor GET /team (bzw. Team-Detail) ein Backfill für Hauptteam +
 * TeamMember-Zuordnung nötig ist. So wird die teure Transaction nur bei Bedarf ausgeführt.
 */
export function defaultTeamSyncRequired(input: {
  organizationMemberCount: number;
  defaultMemberTeamCount: number;
  membersOnCanonicalDefaultTeam: number;
}): boolean {
  if (input.defaultMemberTeamCount !== 1) return true;
  if (input.organizationMemberCount === 0) return false;
  return input.membersOnCanonicalDefaultTeam < input.organizationMemberCount;
}
