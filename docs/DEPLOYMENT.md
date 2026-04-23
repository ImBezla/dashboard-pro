# Deployment – DashboardPro

Überblick: **Next.js (Web)** und **NestJS (API)** als zwei Dienste. Das Repository enthält **Dockerfiles** und **`docker-compose.deploy.yml`** für einen schnellen Go-Live; alternativ kannst du die Apps auf **Vercel + Railway/Fly/Hetzner** o. Ä. getrennt hosten.

**Hostinger + eigene Domain (z. B. dashboardpro.de):** Schritt-für-Schritt mit DNS, nginx und `.env.deploy` → **[DEPLOYMENT-HOSTINGER.md](./DEPLOYMENT-HOSTINGER.md)**.  
**Hostinger VPS (Skripte, `full-go-live.sh`):** **[../deploy/hostinger/README.md](../deploy/hostinger/README.md)**.  
**Master-Checkliste (Reihenfolge, Skripte):** **[GO-LIVE-CHECKLIST.md](./GO-LIVE-CHECKLIST.md)**.

### VPS — Kurzfassung

1. Lokal: `cp .env.deploy.example .env.deploy` ausfüllen, dann `npm run deploy:verify`.
2. Auf dem Server: Repo klonen, `.env.deploy` hochladen (`scp`), im Repo-Root `docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build` (oder `npm run docker:deploy:up`, falls Node installiert ist).
3. Die **komplette Befehlsreihenfolge** inkl. Healthchecks steht in: `npm run deploy:vps` → Skript **`scripts/vps-deploy-steps.sh`** (oben im Skript: **UPDATE** für bestehende Installation, darunter **Erstinstallation**).

### Go-Live mit `.env.deploy` (Registrierung, Supabase, HTTPS)

Vor **`docker compose … up`** im Repo-Root:

```bash
npm run deploy:verify
```

Das Skript **`scripts/verify-env-deploy.sh`** prüft u. a.: **`JWT_SECRET`** (Länge, kein Platzhalter), **`FRONTEND_URL`** / **`NEXT_PUBLIC_SITE_URL`** (**`https://`**, kein **localhost**), **`NEXT_PUBLIC_API_URL`** (**`https://…`** oder **`/api`**), **`DATABASE_URL`** (Postgres-Schema; bei **Supabase Direct `db.*.supabase.co`** Abbruch mit Hinweis auf **Session Pooler**; bei Supabase-Host **`sslmode=require`**), sowie **E-Mail** (**SMTP** oder **Gmail-App-Passwort** oder **`RESEND_API_KEY`**) — außer **`SKIP_EMAIL_VERIFICATION=true`** (nur Tests). **`RESEND_API_KEY`** / **`RESEND_FROM`** werden im **API-Container** über **`docker-compose.deploy.yml`** aus **`.env.deploy`** übernommen.

Die **API** bricht unter **`NODE_ENV=production`** zusätzlich ab, wenn **`JWT_SECRET`** zu schwach ist oder **`FRONTEND_URL`** keine öffentliche **`https://`**-URL ist (kein localhost).

**Supabase:** Session-Pooler-URI aus dem Dashboard, **`?sslmode=require`** — Details: **[SUPABASE.md](./SUPABASE.md)**.

**Sicherheit (Anwendung):** In Produktion sind **keine** localhost-CORS-Origins mehr erlaubt (nur `FRONTEND_URL` / `NEXT_PUBLIC_SITE_URL` / `ADDITIONAL_CORS_ORIGINS`); **HSTS** und **`trust proxy`** (korrekte Client-IP für Throttling/Audit); **Login** führt immer einen bcrypt-Vergleich aus (weniger Timing-Unterschied bei existierender vs. fehlender E-Mail); **Passwörter** mindestens **8** Zeichen, bcrypt standardmäßig Faktor **12** in Produktion (optional **`BCRYPT_ROUNDS`** 10–14); **Prisma** schreibt in Produktion nur **Fehler**-Logs; Session-**Cookie** erhält **`Secure`**, wenn das Web mit **`NODE_ENV=production`** oder **`NEXT_PUBLIC_SITE_URL`** per **https** gebaut wird. **Hinweis:** Das JWT liegt zusätzlich im **localStorage** (für API-Clients) — XSS-Härtung bleibt wichtig (Content-Security-Policy am Proxy/Edge).

**Plattform-Admin (`/admin`):** Zugriff nur bei **`User.role = 'ADMIN'`** in der Datenbank **oder** E-Mail in **`PLATFORM_ADMIN_EMAILS`** (kommagetrennt, in **API** und **Web**-Container identisch setzen, siehe `.env.deploy.example`). Nach Rollenänderung in der DB: **neu einloggen** (JWT enthält `globalRole`).

### VPS — bestehende Installation nur aktualisieren

**Meist:** auf dem Server ins Repo, **`git pull`** — fertig.

**Zusätzlich nur**, wenn dieselbe Maschine die App per **`docker-compose.deploy.yml`** ausliefert: nach dem Pull **`docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build`**, sonst laufen weiter die alten Images (besonders relevant bei geänderten **`NEXT_PUBLIC_*`** / **`JWT_SECRET`**). `.env.deploy` per `scp` nur bei geänderten URLs/Secrets/DB anfassen.

## Checkliste vor Go-Live

1. **`JWT_SECRET`**: starkes Geheimnis (z. B. `openssl rand -base64 48`), **identisch** in API und Web (Middleware).
2. **`FRONTEND_URL`** (API): exakte öffentliche **HTTPS**-URL der Web-App (CORS, E-Mail-Links).
3. **`NEXT_PUBLIC_API_URL`** (Web-Build): URL der API **vom Browser** aus (kein interner Docker-Hostname, wenn Nutzer draußen sind).
4. **`NEXT_PUBLIC_SITE_URL`**: kanonische Web-URL (SEO, OG).
5. **E-Mail**: `SMTP_*` setzen; **`SKIP_EMAIL_VERIFICATION`** in Produktion **nicht** setzen.
6. **Datenbank**: **PostgreSQL** (`DATABASE_URL`, z. B. Supabase — **[SUPABASE.md](./SUPABASE.md)**).
7. **Prisma**: beim API-Start läuft automatisch **`prisma migrate deploy`** (siehe `docker/entrypoint-api.sh`).
8. **TLS**: in Produktion TLS am **Reverse Proxy** (Caddy, Traefik, nginx) terminieren.

## Option A – Docker Compose (empfohlen zum Einstieg)

```bash
cp .env.deploy.example .env.deploy
# .env.deploy bearbeiten: JWT_SECRET, URLs, DATABASE_URL (Supabase → docs/SUPABASE.md), ggf. SMTP

docker compose --env-file .env.deploy -f docker-compose.deploy.yml build
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

- **Web**: [http://127.0.0.1:3000](http://127.0.0.1:3000) (Standard-Bind `WEB_PUBLISH_BIND=127.0.0.1`; lokal testen: `WEB_PUBLISH_BIND=0.0.0.0`).
- **API**: [http://127.0.0.1:3002](http://127.0.0.1:3002) (analog `API_PUBLISH_BIND` / `API_PUBLISH_PORT`).

`NEXT_PUBLIC_*` werden beim **Build** des Web-Images gesetzt (`docker-compose.deploy.yml` → `build.args`). Nach URL-Änderungen **Web-Image neu bauen**.

**Hinweis:** API- und Web-Container laden **`env_file: .env.deploy`**, damit **`DATABASE_URL`** (mit `@`, `:`, ggf. `$` im Passwort) nicht durch Compose-Interpolation in der YAML kaputtgeht.

### Nur API-Image bauen

```bash
docker build -f docker/Dockerfile.api -t dashboardpro-api .
```

### Nur Web-Image bauen

```bash
docker build -f docker/Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://app.example.com \
  -t dashboardpro-web .
```

## Option B – Getrennt hosten (ohne Compose)

### API (Nest)

```bash
cd apps/api
npm ci
npx prisma generate
npm run build
export DATABASE_URL="…"
export JWT_SECRET="…"
export FRONTEND_URL="https://…"
npx prisma migrate deploy
node dist/main.js
```

Prozessmanager: **systemd**, **PM2**, oder Plattform-Paas.

### Web (Next)

```bash
cd apps/web
npm ci
export NEXT_PUBLIC_API_URL="https://…"
export NEXT_PUBLIC_SITE_URL="https://…"
npm run build
PORT=3000 npm start
```

`JWT_SECRET` zur Laufzeit setzen (wie in `.env.example` der Web-App).

## PostgreSQL / Supabase

1. Managed Postgres anlegen (z. B. Supabase) oder selbst hosten.
2. `DATABASE_URL=postgresql://…` in `.env.deploy` bzw. `apps/api/.env` setzen (Details: **[SUPABASE.md](./SUPABASE.md)**).
3. `npx prisma migrate deploy` läuft beim API-Container-Start bzw. in CI.

## CI

GitHub Actions (`.github/workflows/ci.yml`): `npm ci`, **Postgres-Service**, `prisma migrate deploy`, Lint, API-Tests, Turbo-Build, Playwright-Smoke. Für Deploy: z. B. nach `main` Images bauen und zu GHCR pushen – bei Bedarf ergänzen.

## WebSocket

Clients verbinden mit dem **gleichen JWT** wie REST (`NEXT_PUBLIC_API_URL` muss für Browser erreichbar sein). `FRONTEND_URL` in der API muss die Web-Origin für CORS abdecken.

## Troubleshooting

| Problem | Hinweis |
|--------|---------|
| CORS-Fehler | `FRONTEND_URL` exakt inkl. Schema/Port wie im Browser. |
| 403 / leere Seite auf `public_html` | Falsches Hosting: App braucht **VPS + Docker + nginx**, nicht Shared-Webspace. |
| 401 / Login | `JWT_SECRET` Web = API; Cookies / HTTPS SameSite. |
| Prisma migrate schlägt fehl | Migrationen auf dem Ziel-DB-Typ; keine gemischten Provider ohne Plan. |
| Web ruft falsche API auf | `NEXT_PUBLIC_API_URL` **neu builden**, nicht nur zur Laufzeit ändern. |
