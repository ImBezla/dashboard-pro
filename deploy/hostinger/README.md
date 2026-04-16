# Hostinger VPS — Dashboard Pro (ohne `public_html`)

**Wir können deinen Server nicht von hier aus einrichten** — du führst die Befehle **per SSH auf dem VPS** aus.

## Schnellstart (Ubuntu-VPS)

### 1. DNS (Hostinger hPanel)

Je nach Setup:

- **Empfohlen (einfach):** `A`-Einträge für `@`, `www`, `api` → **IPv4 des VPS**
- **Single-Domain (alles unter einer Domain):** `A`-Einträge für `@`, `www` → **IPv4 des VPS** (kein `api` nötig)

### 2. Projekt auf den Server

- **`git clone …`** nach z. B. `/var/www/dashboardpro`, **oder**
- Lokal **`npm run dist:deploy`** und Inhalt von **`dist/deploy/`** per SFTP dorthin kopieren.

### 3. Alles in einem (empfohlen, wenn `.env.deploy` schon fertig ist)

Im **Repo-Root** auf dem VPS:

```bash
cd /var/www/dashboardpro
sudo bash deploy/hostinger/full-go-live.sh dashboardpro.de
```

Das Skript: **`.env.deploy` prüfen** → **nginx (HTTP)** → **`docker compose up --build`**. Anschließend **Certbot** wie ausgegeben.

### 4. Oder Schritt für Schritt

**nginx + (optional) Pakete (API auf Subdomain `api.`):**

```bash
cd /var/www/dashboardpro
sudo bash deploy/hostinger/setup-on-vps.sh --install-deps dashboardpro.de /var/www/dashboardpro
```

Ohne Paketinstallation (wenn nginx/docker schon installiert sind):

```bash
sudo bash deploy/hostinger/setup-on-vps.sh dashboardpro.de /var/www/dashboardpro
```

Ersetze **`dashboardpro.de`** durch deine Domain.

**Alternative: Single-Domain (API unter `/api`)**

Vor nginx-Setup die Template-Datei umstellen:

```bash
export TEMPLATE=deploy/hostinger/nginx-dashboardpro-single-domain.conf.example
```

Dann wie oben `setup-on-vps.sh …` ausführen.

**Env prüfen (ohne sudo):**

```bash
bash scripts/verify-env-deploy.sh .env.deploy
```

**Docker starten:**

```bash
cd /var/www/dashboardpro
cp -n .env.deploy.example .env.deploy
nano .env.deploy   # JWT_SECRET, FRONTEND_URL, NEXT_PUBLIC_*, DATABASE_URL
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build
```

### 5. TLS

Wenn DNS propagiert ist:

```bash
sudo certbot --nginx -d dashboardpro.de -d www.dashboardpro.de -d api.dashboardpro.de
```

Für **Single-Domain** reicht:

```bash
sudo certbot --nginx -d dashboardpro.de -d www.dashboardpro.de
```

---

## Dateien hier

| Datei | Zweck |
|--------|--------|
| `full-go-live.sh` | **Alles nacheinander:** `.env.deploy` prüfen → nginx → `docker compose up --build` (mit `sudo`) |
| `setup-on-vps.sh` | Nur nginx: Site schreiben, `nginx -t`, reload |
| `nginx-dashboardpro.conf.example` | Vorlage (nur **Port 80**; Certbot ergänzt HTTPS) |
| `nginx-dashboardpro-single-domain.conf.example` | Single-Domain: Web auf `/`, API auf `/api` |

Weitere Details: **`docs/DEPLOYMENT-HOSTINGER.md`**, **`docs/DEPLOYMENT.md`**.

## Wichtig

- **`NEXT_PUBLIC_*`** / **`JWT_SECRET`**: nach Änderung **`docker compose … up --build`**.
- **Kein** klassisches Webhosting-`public_html` für diese App.
