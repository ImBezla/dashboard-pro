# DashboardPro – Management Platform

Management-Plattform für Projekt- und Team-Management mit Next.js Frontend und NestJS Backend.

## Features

- Authentifizierung (Login/Register mit JWT)
- Dashboard mit Kennzahlen aus Ihren Daten
- Projekt- und Aufgaben-Management (CRUD)
- Team-Management
- Echtzeit-Updates via WebSocket (Aufgaben)
- Responsives Layout

## Projektstruktur

```
dashboardpro/
├── apps/
│   ├── api/          # NestJS Backend, Prisma unter apps/api/prisma/
│   └── web/          # Next.js Frontend
└── packages/
    └── types/        # Shared TypeScript Types
```

## Setup

### Voraussetzungen

- Node.js 20+ (siehe `package.json` → `engines`)
- npm oder yarn

### 1. Dependencies installieren

```bash
npm install
```

### 2. Backend Setup

```bash
cd apps/api

# .env anlegen (DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL)
# Postgres lokal: repo-root `docker compose up -d`, dann DATABASE_URL wie in apps/api/.env.example
#
# Optional — E-Mail (Nodemailer): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
# SMTP_FROM, SMTP_SECURE (z. B. true bei Port 465).
#
# Optional — SMS (Twilio): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
# (E.164-Absendernummer). Ohne diese Variablen werden SMS-Versuche nur protokolliert bzw. übersprungen.

npm run prisma:generate
npm run prisma:migrate
```

Optional: `npm run prisma:seed` – legt **keine** Demo-Daten an (leerer Seed).

### 3. Frontend Setup

```bash
cd apps/web
# optional: .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3002
```

**Produktion (Web):** `npm run build` im Ordner `apps/web`, dann `npm start` — der Port kommt aus der Umgebungsvariable **`PORT`** (z. B. `PORT=8000 npm start` lokal). Standard von Next.js ist `3000`, wenn `PORT` fehlt.

### Produktion / Docker (Deploy-ready)

Ausführliche Schritte, Umgebungsvariablen und Postgres-Hinweise: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.  
**Hostinger + Domain (z. B. dashboardpro.de):** **[docs/DEPLOYMENT-HOSTINGER.md](docs/DEPLOYMENT-HOSTINGER.md)** · **nginx-Beispiel + Kurzablauf:** **[deploy/hostinger/](deploy/hostinger/)**.  
**Erster Launch / geschlossene Beta:** **[docs/BETA-LAUNCH.md](docs/BETA-LAUNCH.md)**.  
**Go-Live-Checkliste („alles“):** **[docs/GO-LIVE-CHECKLIST.md](docs/GO-LIVE-CHECKLIST.md)** · Env prüfen: `npm run deploy:verify`.

Kurz:

```bash
cp .env.deploy.example .env.deploy
# .env.deploy ausfüllen (JWT_SECRET, FRONTEND_URL, NEXT_PUBLIC_*)

npm run docker:deploy:up
```

Images: `docker/Dockerfile.api`, `docker/Dockerfile.web` · Compose: `docker-compose.deploy.yml`.

### 4. Entwicklung starten

```bash
# im Projektroot
npm run dev
```

- Frontend: **http://localhost:8000** (siehe `apps/web/package.json`)
- Backend: **http://localhost:3002**

Ersten Benutzer über **Registrieren** anlegen, danach einloggen.

## API Endpoints (Auszug)

### Auth

- `POST /auth/register` – Registrierung
- `POST /auth/login` – Login
- `GET /auth/me` – aktueller User

### Dashboard

- `GET /dashboard/overview` – Übersicht

Weitere Routen: Projekte, Aufgaben, Team, Kunden, Rechnungen, … (siehe Nest-Controller).

**Benachrichtigungen (Auszug):** Echtzeit-Socket `/realtime` erwartet dasselbe JWT wie die REST-API (`auth.token`). Kommentar-Erwähnungen per E-Mail: Nutzer-IDs der Organisation als `@<uuid>` (UUID v4) im Kommentartext. SMS: Einwilligung `acceptSmsConsent` beim ersten Aktivieren; Audit-Log `NOTIFICATION_SMS_CONSENT_ACCEPTED`.

### Flow (Prozess-Editor)

- `GET /flow/workspace` — gespeicherten Overlay-Zustand der Organisation (JWT + Org)
- `PUT /flow/workspace` — speichern (`flows`, `nodes`, `edges`, `hiddenSeedFlowIds`)

## WebSocket

Namespace: `/realtime` – u. a. `task.created`, `task.updated`, `task.deleted`.

## Tech Stack

- Backend: NestJS, Prisma, Socket.IO, JWT
- Frontend: Next.js 14 (App Router), React 18, Tailwind, TanStack Query, Zustand

## License

MIT
