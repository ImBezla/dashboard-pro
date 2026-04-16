# Deployment – DashboardPro

Überblick: **Next.js (Web)** und **NestJS (API)** als zwei Dienste. Das Repository enthält **Dockerfiles** und **`docker-compose.deploy.yml`** für einen schnellen Go-Live; alternativ kannst du die Apps auf **Vercel + Railway/Fly/Hetzner** o. Ä. getrennt hosten.

**Hostinger + eigene Domain (z. B. dashboardpro.de):** Schritt-für-Schritt mit DNS, nginx und `.env.deploy` → **[DEPLOYMENT-HOSTINGER.md](./DEPLOYMENT-HOSTINGER.md)**.  
**Master-Checkliste (Reihenfolge, Skripte):** **[GO-LIVE-CHECKLIST.md](./GO-LIVE-CHECKLIST.md)**.

## Checkliste vor Go-Live

1. **`JWT_SECRET`**: starkes Geheimnis (z. B. `openssl rand -base64 48`), **identisch** in API und Web (Middleware).
2. **`FRONTEND_URL`** (API): exakte öffentliche **HTTPS**-URL der Web-App (CORS, E-Mail-Links).
3. **`NEXT_PUBLIC_API_URL`** (Web-Build): URL der API **vom Browser** aus (kein interner Docker-Hostname, wenn Nutzer draußen sind).
4. **`NEXT_PUBLIC_SITE_URL`**: kanonische Web-URL (SEO, OG).
5. **E-Mail**: `SMTP_*` setzen; **`SKIP_EMAIL_VERIFICATION`** in Produktion **nicht** setzen.
6. **Datenbank**: Standard im Compose ist **SQLite auf Volume** (`DATABASE_URL=file:/data/prod.db`). Für mehrere API-Instanzen oder HA → **PostgreSQL** (siehe unten).
7. **Prisma**: beim API-Start läuft automatisch **`prisma migrate deploy`** (siehe `docker/entrypoint-api.sh`).
8. **TLS**: in Produktion TLS am **Reverse Proxy** (Caddy, Traefik, nginx) terminieren.

## Option A – Docker Compose (empfohlen zum Einstieg)

```bash
cp .env.deploy.example .env.deploy
# .env.deploy bearbeiten: JWT_SECRET, URLs, ggf. SMTP

docker compose --env-file .env.deploy -f docker-compose.deploy.yml build
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d
```

- **Web**: [http://127.0.0.1:3000](http://127.0.0.1:3000) (Standard-Bind `WEB_PUBLISH_BIND=127.0.0.1`; lokal testen: `WEB_PUBLISH_BIND=0.0.0.0`).
- **API**: [http://127.0.0.1:3002](http://127.0.0.1:3002) (analog `API_PUBLISH_BIND` / `API_PUBLISH_PORT`).

`NEXT_PUBLIC_*` werden beim **Build** des Web-Images gesetzt (`docker-compose.deploy.yml` → `build.args`). Nach URL-Änderungen **Web-Image neu bauen**.

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

## PostgreSQL statt SQLite

1. Postgres starten (z. B. Repo-`docker-compose.yml` nur `postgres`-Service, oder Managed DB).
2. In `apps/api/prisma/schema.prisma` den **`provider`** auf `postgresql` stellen und **Migrationen** für Postgres erzeugen bzw. von einer Referenz-DB migrieren (einmaliger Schritt – mit Team abstimmen).
3. `DATABASE_URL=postgresql://…` setzen.
4. `npx prisma migrate deploy` in der Pipeline / beim Start.

Die mitgelieferten Compose-Dateien sind für **SQLite** ausgelegt; für Postgres **kein** `/data`-Volume für die DB-Datei nötig, dafür Netzwerk-Zugang zur Datenbank.

## CI

GitHub Actions (`.github/workflows/ci.yml`): `npm ci`, `prisma migrate deploy` (SQLite-Datei in CI), Lint, API-Tests, Turbo-Build, Playwright-Smoke. Für Deploy: z. B. nach `main` Images bauen und zu GHCR pushen – bei Bedarf ergänzen.

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
