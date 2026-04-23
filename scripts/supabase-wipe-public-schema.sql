-- =============================================================================
-- WARNUNG: Löscht ALLES im Schema `public` dieser Supabase-Datenbank
-- (alle DashboardPro-Tabellen + _prisma_migrations). Nicht rückgängig.
-- Schemas wie auth, storage, extensions bleiben in der Regel unberührt.
--
-- Wann: P3009-Schleife — nach `migrate resolve --rolled-back` schlägt
-- `migrate deploy` erneut fehl (z. B. "relation User already exists"), weil
-- Tabellen schon teilweise existieren.
--
-- Danach: API-Container neu starten → prisma migrate deploy legt alles neu an.
-- =============================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Typische Supabase-Rechte (Stand gängiger Supabase-Doku; bei Bedarf im Dashboard prüfen)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT CREATE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
