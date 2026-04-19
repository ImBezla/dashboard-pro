# Supabase als Datenbank

Die API nutzt **Prisma mit PostgreSQL**. Supabase liefert eine verwaltete Postgres-Instanz; **Supabase Auth** wird hier nicht verwendet (Login bleibt in der NestJS-API).

## Was du in Supabase brauchst

1. **Projekt** anlegen ([supabase.com](https://supabase.com)).
2. Unter **Project Settings → Database** (oder **Connect** im Dashboard):
   - **Database password** (beim Anlegen gesetzt; ggf. zurücksetzen merken).
   - **Connection string**: Supabase-Direct (`db.<ref>.supabase.co:5432`) ist **[IPv6-only](https://supabase.com/docs/guides/database/connecting-to-postgres)**. Viele Docker-Hosts haben **kein IPv6** im Container-Netz → Prisma meldet dann **`P1001`**, obwohl `nc` auf dem VPS-Host klappt.
   - **Ohne Docker-IPv6**: im Dashboard **Session pooler** wählen (Host `aws-0-<REGION>.pooler.supabase.com`, Port **5432**, Nutzer oft `postgres.<ref>`) und diese URI als **`DATABASE_URL`** nutzen — unterstützt IPv4 und IPv6. Für `prisma migrate deploy` im Entrypoint ist Session-Mode in der Praxis geeignet; Transaction-Mode (Port **6543**) eher für kurzlebige Clients und mit Prisma-Einschränkungen.
   - Wenn dein Server **IPv6 bis in den Container** hat, kannst du weiter die **Direct**-URI verwenden.
3. In der URI bei Bedarf **`?sslmode=require`** anhängen (häufig nötig).

## Was du ins Repo / `.env.deploy` schreibst

Nur **`DATABASE_URL`** (und den Rest von `.env.deploy` wie bisher: `JWT_SECRET`, URLs, SMTP).

Beispiel (Platzhalter ersetzen):

```env
# Empfohlen auf typischen VPS + Docker (IPv4): exakte Zeile aus Dashboard → Connect → Session mode kopieren, z. B.:
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require

# Alternative: Direct (IPv6), nur wenn dein Container-Netz IPv6 hat:
# DATABASE_URL=postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres?sslmode=require
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
