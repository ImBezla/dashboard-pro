# Supabase als Datenbank

Die API nutzt **Prisma mit PostgreSQL**. Supabase liefert eine verwaltete Postgres-Instanz; **Supabase Auth** wird hier nicht verwendet (Login bleibt in der NestJS-API).

## Was du in Supabase brauchst

1. **Projekt** anlegen ([supabase.com](https://supabase.com)).
2. Unter **Project Settings → Database**:
   - **Database password** (beim Anlegen gesetzt; ggf. zurücksetzen merken).
   - **Connection string → URI** — für `prisma migrate deploy` im API-Container am zuverlässigsten die **Direct**-Verbindung (Host meist `db.<ref>.supabase.co`, Port **5432**), nicht den Transaction-Pooler (6543), sofern du nicht getrennte URLs für App vs. Migration konfigurierst.
3. In der URI bei Bedarf **`?sslmode=require`** anhängen (häufig nötig).

## Was du ins Repo / `.env.deploy` schreibst

Nur **`DATABASE_URL`** (und den Rest von `.env.deploy` wie bisher: `JWT_SECRET`, URLs, SMTP).

Beispiel (Platzhalter ersetzen):

```env
DATABASE_URL=postgresql://postgres:[DEIN-PASSWORT]@db.[DEIN-REF].supabase.co:5432/postgres?sslmode=require
```

**Nicht** committen: echtes Passwort nur in **`.env.deploy`** auf dem Server bzw. lokal.

## Deploy

- In **`.env.deploy`**: `DATABASE_URL` setzen (Supabase-URI).
- Optional: `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=0` (ist im `docker-compose.deploy.yml` bereits der Default).
- Container neu bauen/starten: `docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build`  
  Beim Start läuft **`prisma migrate deploy`** und legt Tabellen in Supabase an.

### Schema einmalig von deinem Rechner gegen Supabase

Wenn du die Tabellen **vor** dem ersten Container-Start oder separat anlegen willst (nur `DATABASE_URL` in der Shell, nicht in Git):

```bash
export DATABASE_URL='postgresql://postgres:…@db….supabase.co:5432/postgres?sslmode=require'
bash scripts/supabase-migrate-deploy.sh
```

## Bestehende SQLite-Daten

Die alte **SQLite**-Datei wird **nicht** automatisch importiert. Optionen:

- **Neu starten** (leere Supabase-DB): nichts weiter tun.
- **Daten übernehmen**: Export (z. B. Dump/CSV) und manueller Import oder Tooling — separat planen.

## Lokale Entwicklung

Repo-Root: `docker compose up -d` startet Postgres; in `apps/api/.env` dieselbe URL wie in `apps/api/.env.example` (localhost).
