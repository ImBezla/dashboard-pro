# Erster Launch — geschlossene Beta (Dashboard Pro)

Kurzfassung für **ein paar Beta-Tester**: online bringen, ohne „Marketing-Livegang“ oder Rechts-Endgültigkeit vorzutäuschen.

## 1. Zielbild Beta

- **Kleine, vertrauenswürdige Gruppe** (persönliche Einladung, kein großes SEO/Paid).
- **Fehler und Ausfälle** sind ok — kommuniziert einen **Feedback-Kanal** (E-Mail, Chat).
- **Rechtliches**: Impressum nutzbar; **Datenschutz/AGB** vor breiterem Launch **anwaltlich** finalisieren (aktuell Platzhalter-Struktur im Repo).

## 2. Umgebungsvariablen (Pflicht)

### API (`apps/api` — siehe `apps/api/.env.example`)

| Variable | Hinweis |
|----------|---------|
| `DATABASE_URL` | Persistent (kein reines Dev-SQLite auf dem Server, wenn ihr echte Daten wollt). |
| `JWT_SECRET` | Stark, zufällig (z. B. `openssl rand -base64 32`). **Darf nicht der Default bleiben.** |
| `FRONTEND_URL` | Öffentliche **https://**-URL der Web-App (CORS + E-Mail-Links). |
| `PORT` | z. B. `3002` intern; nach außen per Reverse-Proxy. |

**E-Mail (empfohlen):** `SMTP_*` oder Gmail-Variante setzen — sonst keine Verifizierungs-/Passwort-Mails.  
Nur für **interne** Spielwiese: `SKIP_EMAIL_VERIFICATION=true` (nicht für echte externe Tester).

### Web (`apps/web` — siehe `apps/web/.env.example`)

| Variable | Hinweis |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Öffentliche **https://**-URL der API (vom Browser erreichbar). |
| `NEXT_PUBLIC_SITE_URL` | Öffentliche **https://**-URL der Web-App — **wichtig** für Open Graph, Sitemap, Canonicals. |
| `JWT_SECRET` | **Identisch** zur API — sonst funktionieren Cookie/Middleware und Login nicht konsistent. |

Optional: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, Bing/Yandex, Twitter, GEO — siehe `.env.example`.

## 3. Deploy-Pfad

- **Docker (empfohlen):** Root-`README` → `docs/DEPLOYMENT.md` und `docs/DEPLOYMENT-HOSTINGER.md`, `.env.deploy.example` → `.env.deploy`.
- **TLS:** immer **HTTPS** nach außen (Proxy oder PaaS).

### Ordner zum Hochladen (ohne Git)

Im Projektroot:

```bash
npm run dist:deploy
```

Dann den Inhalt von **`dist/deploy/`** per SFTP/SCP auf den VPS kopieren (oder `dist/deploy` als ZIP packen). Das ist **kein** fertig gebautes `node_modules`, sondern der **Quellbaum für `docker compose … --build`** auf dem Server — kleiner und übersichtlicher als das ganze Repo inkl. aller `node_modules`.

## 4. Smoke-Tests vor „Einladung raus“

1. **Registrierung** → E-Mail-Verifizierung (falls aktiv) → **Login**.  
2. **Workspace anlegen** / Einladungscode.  
3. **Dashboard** laden, eine **Aufgabe** anlegen, Seite neu laden.  
4. **Passwort vergessen** (falls SMTP aktiv).  
5. **Öffentliche Seiten**: `/`, `/impressum`, `/datenschutz`, `/agb` ohne Login.  
6. **Link-Vorschau** (WhatsApp/Slack): `NEXT_PUBLIC_SITE_URL` muss die **echte** Domain sein.

## 5. Nach dem Launch

- Logs kurz beobachten (API + Web).  
- Bekannte **Limitationen** an Tester schicken (z. B. keine SLA, keine Garantie auf Datenmigration).  
- **Backup** der DB-Datei bzw. Postgres-Volume einplanen, bevor viele echte Daten drin sind.

## 6. Wann „nicht mehr nur Beta“

- Rechtstexte final, USt-Id/Angaben vollständig.  
- Monitoring, Backups, Incident-Kontakt.  
- Rate-Limits und Abuse-Szenarien geprüft (je nach Risiko).
