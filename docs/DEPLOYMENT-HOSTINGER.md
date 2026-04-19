# DashboardPro auf Hostinger – **dashboardpro.de**

Dieses Projekt braucht **zwei laufende Node-Dienste** (Next.js + NestJS) und optional Docker. Auf **normalem Webhosting** (nur PHP / statische Seiten) läuft das so **nicht**. Praktikabel ist ein **Hostinger VPS (KVM)** mit Ubuntu und Docker **oder** zwei getrennte Dienste (Web auf Hostinger, API woanders) – unten: **ein VPS, eine Domain, Subdomain für die API**.

## Kurzüberblick

| Komponente | Öffentliche URL | Intern (Beispiel) |
|------------|------------------|-------------------|
| Web (Next) | `https://dashboardpro.de` | `127.0.0.1:3000` |
| API (Nest + WebSocket) | `https://api.dashboardpro.de` | `127.0.0.1:3002` |

## 1. DNS bei Hostinger (hPanel → Domains → DNS)

Lege (oder prüfe) folgende Einträge zur **VPS-IP**:

| Typ | Name / Host | Ziel |
|-----|-------------|------|
| **A** | `@` (oder leer) | IPv4 deines VPS |
| **A** | `www` | dieselbe IPv4 |
| **A** | `api` | dieselbe IPv4 |

Optional **AAAA** (IPv6), falls dein VPS und Hostinger das unterstützen.

Wartezeit: oft wenige Minuten, manchmal bis zu 24 h.

## 2. SSL (HTTPS)

Auf dem VPS:

- **Certbot + nginx** (üblich), oder  
- **Caddy** (automatisches TLS mit wenig Konfiguration).

Zertifikate für **`dashboardpro.de`**, **`www.dashboardpro.de`** und **`api.dashboardpro.de`** ausstellen (ein Zertifikat mit mehreren SANs oder getrennte Server-Blöcke – je nach Tool).

In Hostinger hPanel gibt es je nach Produkt auch **SSL für die Domain** – bei VPS musst du TLS meist selbst am Reverse Proxy terminieren.

## 3. Reverse Proxy (nginx)

In **`docker-compose.deploy.yml`** sind **Web (3000)** und **API (3002)** standardmäßig an **`127.0.0.1`** gebunden — von außen nur über **nginx** (oder Caddy) auf **443** erreichbar. Zum direkten Test ohne Proxy (unsicher): in **`.env.deploy`** `API_PUBLISH_BIND=0.0.0.0` und `WEB_PUBLISH_BIND=0.0.0.0` setzen.

**Fertige Beispielkonfiguration (anpassen, Zertifikate/Certbot):**  
`deploy/hostinger/nginx-dashboardpro.conf.example` — Schritte: **`deploy/hostinger/README.md`**.

### Beispiel `server`-Blöcke (vereinfacht)

```nginx
# Web – dashboardpro.de
server {
    listen 443 ssl http2;
    server_name dashboardpro.de www.dashboardpro.de;

    # ssl_certificate / ssl_certificate_key … (Certbot-Pfade)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API + WebSocket – api.dashboardpro.de
server {
    listen 443 ssl http2;
    server_name api.dashboardpro.de;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # WebSocket / Socket.IO
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

HTTP → HTTPS-Weiterleitung (Port 80) separat mit Certbot einrichten.

## 4. Umgebungsvariablen (`.env.deploy`)

Für **dashboardpro.de** und API-Subdomain:

```env
JWT_SECRET=<starkes-einmaliges-geheimnis-gleich-in-api-und-web>
FRONTEND_URL=https://dashboardpro.de
NEXT_PUBLIC_SITE_URL=https://dashboardpro.de
NEXT_PUBLIC_API_URL=https://api.dashboardpro.de

# PostgreSQL (Supabase → Connect → Session mode; Host pooler.supabase.com — nicht db.* für Docker/VPS)
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORT]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
```

- **`FRONTEND_URL`**: exakt die Origin der Web-App (CORS, E-Mail-Links) – hier ohne `www`, wenn nur die Apex-Domain genutzt wird; sonst konsistent zu dem, was Nutzer im Browser sehen.
- **`NEXT_PUBLIC_API_URL`**: muss für **Browser** erreichbar sein → `https://api.dashboardpro.de`.
- **`JWT_SECRET`**: identisch für **API-Container** und **Web-Container** (Next-Middleware).
- **`DATABASE_URL`**: Details und Supabase → **[SUPABASE.md](./SUPABASE.md)**.

Nach dem ersten `docker compose … up --build` sind die `NEXT_PUBLIC_*`-Werte im Web-Image **eingebacken**. Änderst du die URLs, **Web-Image neu bauen**.

## 5. Auf dem VPS ausrollen

```bash
# Repo auf den Server (git clone / scp / CI-Deploy)
cd dashboardpro
cp .env.deploy.example .env.deploy
nano .env.deploy   # Werte wie oben

docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build
```

Firewall (z. B. `ufw`): **22**, **80**, **443** erlauben – **nicht** 3000/3002 öffentlich, wenn du nur localhost-publish nutzt.

## 6. Hostinger-spezifische Hinweise

- **VPS auswählen**: mindestens **2 GB RAM** für Next + Nest + Docker ist ein sinnvoller Einstieg.  
- **Snapshots**: vor größeren Updates einen Snapshot im hPanel anlegen.  
- **E-Mail**: Hostinger **SMTP** (hPanel → E-Mails) kannst du für `SMTP_*` in der API nutzen, sofern erlaubt und Zugangsdaten vorhanden.

## 7. Optional: nur Domain bei Hostinger

Wenn du **keinen** VPS bei Hostinger willst: Domain-DNS auf einen anderen Anbieter zeigen (z. B. API + Web als Managed PaaS). Die **`.env.deploy`-URLs** bleiben dasselbe Prinzip: eine kanonische Web-URL und eine öffentliche API-URL.

---

Siehe auch: [DEPLOYMENT.md](./DEPLOYMENT.md) (allgemein, Postgres, Troubleshooting).
