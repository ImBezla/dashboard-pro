-- Einmalig: Spalte für Standard-Team (Beitritte), idempotent für Postgres
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "defaultMemberTeam" BOOLEAN NOT NULL DEFAULT false;
