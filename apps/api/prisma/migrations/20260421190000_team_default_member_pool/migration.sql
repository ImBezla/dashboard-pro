-- Standard-Team: neue Mitglieder per Beitrittscode werden hier eingetragen.
ALTER TABLE "Team" ADD COLUMN "defaultMemberTeam" BOOLEAN NOT NULL DEFAULT false;
