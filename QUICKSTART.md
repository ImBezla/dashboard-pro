# DashboardPro – Kurzstart

## 1. Dependencies

```bash
npm install
```

## 2. Datenbank (API)

```bash
cd apps/api
```

`.env` anlegen, mindestens:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="ein-langer-zufaelliger-string"
PORT=3002
FRONTEND_URL="http://localhost:8000"
```

```bash
npm run prisma:generate
npm run prisma:migrate
```

`npm run prisma:seed` ist optional und fügt **keine** Beispieldaten ein.

## 3. Server starten

**Terminal 1 – Backend**

```bash
cd apps/api
npm run dev
```

**Terminal 2 – Frontend**

```bash
cd apps/web
npm run dev
```

## 4. Im Browser

- App: **http://localhost:8000**
- API: **http://localhost:3002**

Zuerst **Registrieren**, dann mit dem neuen Konto anmelden.

## Nützliche Befehle

| Ort        | Befehl                 | Zweck                |
| ---------- | ---------------------- | -------------------- |
| `apps/api` | `npm run prisma:generate` | Prisma Client     |
| `apps/api` | `npm run prisma:migrate`  | Migrationen       |
| Root       | `npm run dev`             | API + Web (Turbo) |

## Troubleshooting

- **DB-Fehler:** `DATABASE_URL` prüfen, Migrationen erneut ausführen.
- **Port belegt:** `PORT` in `apps/api` bzw. `-p` in `apps/web` anpassen.
- **CORS:** `FRONTEND_URL` zur tatsächlichen Frontend-URL setzen.
