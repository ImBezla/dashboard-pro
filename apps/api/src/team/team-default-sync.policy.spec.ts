import { defaultTeamSyncRequired } from './team-default-sync.policy';

describe('defaultTeamSyncRequired', () => {
  it('true wenn kein oder mehrere Hauptteam-Flags', () => {
    expect(
      defaultTeamSyncRequired({
        organizationMemberCount: 3,
        defaultMemberTeamCount: 0,
        membersOnCanonicalDefaultTeam: 0,
      }),
    ).toBe(true);
    expect(
      defaultTeamSyncRequired({
        organizationMemberCount: 3,
        defaultMemberTeamCount: 2,
        membersOnCanonicalDefaultTeam: 3,
      }),
    ).toBe(true);
  });

  it('false wenn genau ein Hauptteam und keine Org-Mitglieder', () => {
    expect(
      defaultTeamSyncRequired({
        organizationMemberCount: 0,
        defaultMemberTeamCount: 1,
        membersOnCanonicalDefaultTeam: 0,
      }),
    ).toBe(false);
  });

  it('true wenn Org-Mitglieder fehlen im Hauptteam', () => {
    expect(
      defaultTeamSyncRequired({
        organizationMemberCount: 5,
        defaultMemberTeamCount: 1,
        membersOnCanonicalDefaultTeam: 2,
      }),
    ).toBe(true);
  });

  it('false wenn alle Org-Mitglieder im Hauptteam erfasst sind', () => {
    expect(
      defaultTeamSyncRequired({
        organizationMemberCount: 4,
        defaultMemberTeamCount: 1,
        membersOnCanonicalDefaultTeam: 4,
      }),
    ).toBe(false);
  });
});
