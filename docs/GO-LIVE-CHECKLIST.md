# Go-Live — „Alles“ auf einen Blick (Dashboard Pro)

Reihenfolge für **Beta / erster Produktions-Server** (typisch Hostinger **VPS**, nicht `public_html`).

## 1. Domain & DNS

- [ ] **A-Records** für `@`, `www`, `api` → IPv4 des VPS  
- [ ] Optional **AAAA** (IPv6), wenn unterstützt  

→ Details: [DEPLOYMENT-HOSTINGER.md](./DEPLOYMENT-HOSTINGER.md)

## 2. Server (VPS)

- [ ] **Ubuntu** (oder vergleichbar), SSH-Zugang  
- [ ] **Docker** + **Docker Compose** (Plugin `docker compose`)  
- [ ] **nginx** + **certbot** (z. B. per `setup-on-vps.sh --install-deps`)  

## 3. Projekt auf den Server

Wähle **eine** Variante:

- [ ] `git clone …` nach z. B. `/var/www/dashboardpro`  
- [ ] Lokal `npm run dist:deploy` → Inhalt von **`dist/deploy/`** per SFTP/ZIP auf den Server  

## 4. Konfiguration

- [ ] **`cp .env.deploy.example .env.deploy`** im **Repo-Root** auf dem Server  
- [ ] Werte setzen: `JWT_SECRET`, `FRONTEND_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, `DATABASE_URL`  
- [ ] Prüfen: `npm run deploy:verify` **oder** `bash scripts/verify-env-deploy.sh .env.deploy`  

## 5. Ein Befehl (nginx + Docker)

Im Repo-Root auf dem VPS (Domain anpassen):

```bash
sudo bash deploy/hostinger/full-go-live.sh dashboardpro.de
```

Oder **einzeln**: [deploy/hostinger/README.md](../deploy/hostinger/README.md) (`setup-on-vps.sh`, dann `docker compose …`).

## 6. TLS

- [ ] DNS propagiert  
- [ ] `sudo certbot --nginx -d DEINE-DOMAIN -d www.DEINE-DOMAIN -d api.DEINE-DOMAIN`  

## 7. Smoke-Tests

- [ ] `https://DEINE-DOMAIN/` lädt  
- [ ] Registrierung / Login  
- [ ] API: `https://api.DEINE-DOMAIN/health` (JSON ok)  
- [ ] E-Mail-Flows (falls SMTP aktiv)  

## 8. Betrieb

- [ ] **Backup** der SQLite-Datei im Docker-Volume (`/data/prod.db` im API-Container) oder Snapshot des VPS  
- [ ] Rechtstexte / Impressum für euren Fall final (siehe [BETA-LAUNCH.md](./BETA-LAUNCH.md))  

## Referenz

| Thema | Datei / Skript |
|--------|----------------|
| Hostinger Schritte | `docs/DEPLOYMENT-HOSTINGER.md` |
| Docker allgemein | `docs/DEPLOYMENT.md` |
| Beta-Hinweise | `docs/BETA-LAUNCH.md` |
| nginx + optionale Pakete | `deploy/hostinger/setup-on-vps.sh` |
| Alles nacheinander (VPS) | `deploy/hostinger/full-go-live.sh` |
| `.env.deploy` prüfen | `scripts/verify-env-deploy.sh` |
| Upload-Paket (ohne `node_modules`) | `npm run dist:deploy` → `dist/deploy/` |
| CI (Lint, Tests, Build) | `.github/workflows/ci.yml` |
