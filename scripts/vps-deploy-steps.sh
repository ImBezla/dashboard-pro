#!/usr/bin/env bash
# Zeigt die Reihenfolge für VPS-Deploy (Docker + Supabase). Optional: .env.deploy prüfen.
# Aufruf: bash scripts/vps-deploy-steps.sh   oder   npm run deploy:vps
#         bash scripts/vps-deploy-steps.sh --verify   (nur wenn .env.deploy existiert)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VPS_HOST="${VPS_HOST:-DEINE_VPS_IP}"

if [[ "${1:-}" == "--update" ]]; then
  cat <<'EOF'
=== DashboardPro — VPS UPDATE ===

Auf dem VPS (Repo-Root, Pfad anpassen):
  cd /PFAD/ZUM/REPO && git pull

Das ist bei euch meistens alles.

Nur wenn dieser Server die App per Docker aus diesem Repo fährt — sonst laufen alte Images:
  docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build

.env.deploy nur neu per scp, wenn URLs/Secrets/DATABASE_URL geändert wurden.
Mehr: npm run deploy:vps
EOF
  exit 0
fi

cat <<'EOF'
=== DashboardPro — VPS hochladen / live schalten ===

WICHTIG — zwei Rechner
  • Befehle mit „ssh root@…“ oder „cd …/dashboardpro“: auf dem VPS ausführen (nach ssh), nicht auf dem Mac.
  • „cd /root“ gibt es auf dem Mac nicht — /root ist das Home von root auf Linux.

Voraussetzungen auf dem VPS
  • Ubuntu o. Ä., SSH
  • Docker + Plugin „docker compose“
  • Optional: nginx/Caddy + TLS (öffentliche https-URLs)

--- UPDATE — Version läuft schon (üblich: nur pullen) ---

  Auf dem VPS in den **Repo-Root** (z. B. /root/dashboardpro oder /var/www/dashboardpro):
    cd /PFAD/ZUM/REPO && git pull

  .env.deploy nur neu hochladen, wenn sich **URLs, Secrets oder DATABASE_URL** geändert haben:
    scp .env.deploy root@DEINE_VPS_IP:/PFAD/ZUM/REPO/.env.deploy

  **Nur wenn** ihr die App mit **docker-compose.deploy.yml** auf diesem Host betreibt — ohne neuen Build bleiben alte Images:
    docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build
    (oder: npm run docker:deploy:up — falls Node/npm auf dem VPS installiert ist)

  Dabei: API startet mit **prisma migrate deploy** (docker/entrypoint-api.sh). Optional prüfen:
    curl -sS http://127.0.0.1:3002/health
    curl -sS -o /dev/null -w "Web %{http_code}\n" http://127.0.0.1:3000/

--- ERSTINSTALLATION — noch kein Klon / neuer Server ---

1) Code auf den Server — ZUERST (sonst schlägt scp fehl: „No such file or directory“)

  Platzhalter DEINE_VPS_IP durch die IPv4 des VPS ersetzen (oder vor dem Skript: export VPS_HOST=1.2.3.4).

  Vom Mac aus, einmalig (klont nach /root/dashboardpro auf dem VPS):
    ssh root@DEINE_VPS_IP "git clone https://github.com/ImBezla/dashboard-pro.git dashboardpro && ls -la dashboardpro/docker-compose.deploy.yml"

  Wenn der Ordner schon existiert:
    ssh root@DEINE_VPS_IP "cd dashboardpro && git pull"

  Oder interaktiv auf dem VPS:
    ssh root@DEINE_VPS_IP
    cd /root
    git clone https://github.com/ImBezla/dashboard-pro.git dashboardpro
    cd dashboardpro && git checkout main && git pull

  Anderen Branch deployen: git checkout <branch-name> && git pull

  Hostinger-VPS mit nginx/Certbot in einem Rutsch: deploy/hostinger/README.md → full-go-live.sh

  B) Ohne Git — Bundle auf dem Mac:
     npm run dist:deploy
     → dist/deploy/ per scp/rsync auf den VPS, dann dort cd …

2) Umgebung (.env.deploy — nicht ins Git committen)
     Lokal am Mac: .env.deploy pflegen, dann ERST NACH Schritt 1 hochladen.

     scp NUR vom Mac aus (nicht auf dem VPS — dort gibt es keinen /Users/…-Pfad):
     scp .env.deploy root@DEINE_VPS_IP:/root/dashboardpro/.env.deploy

     (Wenn der Klon woanders liegt: Zielpfad anpassen, auf dem VPS finden mit:
      ssh root@DEINE_VPS_IP "find /root /home -maxdepth 5 -name docker-compose.deploy.yml 2>/dev/null")

     Variablen in .env.deploy u. a.:
       JWT_SECRET          (stark, z. B. openssl rand -base64 48)
       FRONTEND_URL        (https://… Web-App)
       NEXT_PUBLIC_SITE_URL
       NEXT_PUBLIC_API_URL (https://… API, vom Browser erreichbar)
       DATABASE_URL        (Supabase Session Pooler auf Docker/VPS — docs/SUPABASE.md)
       E-Mail: SMTP_* oder SMTP_USER + GMAIL_APP_PASSWORD

3) Prüfen (im Repo-Root auf dem VPS, .env.deploy muss liegen)

  Mit npm (falls Node auf dem VPS installiert ist):
     npm run deploy:verify

  Ohne npm (reicht — nur bash):
     bash scripts/verify-env-deploy.sh .env.deploy

4) Container bauen & starten (im Repo-Root auf dem VPS)

  Wenn **apps/api/prisma/migrations** zuletzt geändert wurde: **API-Image neu bauen**, sonst läuft im
  Container noch **alte** migration.sql (häufiger Grund für P3009 nach git pull):
     bash scripts/vps-rebuild-api.sh
     (oder: npm run deploy:vps:rebuild-api — falls npm auf dem VPS installiert ist)

  Vollständiger Stack (Web + API, nach größeren Pulls):
  Mit npm:
     npm run docker:deploy:up

  Ohne npm (Standard auf bare Ubuntu-VPS):
     docker compose --env-file .env.deploy -f docker-compose.deploy.yml build
     docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d

5) Healthchecks (auf dem VPS, Standard: nur 127.0.0.1)
     curl -sS http://127.0.0.1:3002/health
     curl -sS -o /dev/null -w "Web HTTP %{http_code}\n" http://127.0.0.1:3000/

     API startet nicht, Logs: Prisma **P3009** / fehlgeschlagene Migration **20251117120204_init**:
       git pull   (Skript muss im Repo liegen)
       Ohne npm auf dem VPS:
         bash scripts/prisma-resolve-failed-migration.sh rolled-back 20251117120204_init
       Mit npm: npm run deploy:prisma:fix-p3009-init
       docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d api
       sleep 90 && docker compose … logs --tail=50 api && curl -sS http://127.0.0.1:3002/health
       (Details: docs/DEPLOYMENT.md → Troubleshooting P3009)

6) Öffentlich mit HTTPS
     docs/DEPLOYMENT-HOSTINGER.md
     docs/GO-LIVE-CHECKLIST.md

Hinweis: NEXT_PUBLIC_* werden ins Web-Image gebaut — nach URL-Änderung immer „docker:deploy:up“ neu.
EOF

echo ""
echo "→ Nur wenn Schritt 1 (clone) auf dem VPS schon geklappt hat — .env.deploy hochladen:"
echo "  (Tipp: export VPS_HOST=1.2.3.4 — dann wird unten deine IP eingesetzt.)"
if [[ -f "$ROOT/.env.deploy" ]]; then
  echo "  scp \"$ROOT/.env.deploy\" root@${VPS_HOST}:/root/dashboardpro/.env.deploy"
else
  echo "  (noch keine .env.deploy hier — zuerst lokal anlegen, dann erneut npm run deploy:vps)"
fi

if [[ "${1:-}" == "--verify" ]]; then
  if [[ ! -f "$ROOT/.env.deploy" ]]; then
    echo "" >&2
    echo "→ Keine .env.deploy gefunden ($ROOT/.env.deploy). Zuerst Schritt 2." >&2
    exit 1
  fi
  echo ""
  echo "→ Prüfe .env.deploy …"
  bash "$ROOT/scripts/verify-env-deploy.sh" "$ROOT/.env.deploy"
fi
