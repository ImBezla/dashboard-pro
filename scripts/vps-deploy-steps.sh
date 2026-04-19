#!/usr/bin/env bash
# Zeigt die Reihenfolge für VPS-Deploy (Docker + Supabase). Optional: .env.deploy prüfen.
# Aufruf: bash scripts/vps-deploy-steps.sh   oder   npm run deploy:vps
#         bash scripts/vps-deploy-steps.sh --verify   (nur wenn .env.deploy existiert)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cat <<'EOF'
=== DashboardPro — VPS hochladen / live schalten ===

Voraussetzungen auf dem VPS
  • Ubuntu o. Ä., SSH
  • Docker + Plugin „docker compose“
  • Optional: nginx/Caddy + TLS (öffentliche https-URLs)

1) Code auf den Server
  A) Git (empfohlen):
     git clone <DEINE_REPO-URL>
     cd dashboardpro
     git checkout <branch>    # z. B. main oder cursor/postgresql-supabase-migration

  B) Ohne Git — Bundle auf dem Mac:
     npm run dist:deploy
     → Ordner dist/deploy/ per scp/rsync auf den VPS kopieren, dort cd <Zielordner>

2) Umgebung (.env.deploy — nicht ins Git committen)
     cp .env.deploy.example .env.deploy
     Editor: mindestens
       JWT_SECRET          (stark, z. B. openssl rand -base64 48)
       FRONTEND_URL        (https://… Web-App)
       NEXT_PUBLIC_SITE_URL
       NEXT_PUBLIC_API_URL (https://… API, vom Browser erreichbar)
       DATABASE_URL        (Supabase Direct URI — docs/SUPABASE.md)
       E-Mail: SMTP_* oder SMTP_USER + GMAIL_APP_PASSWORD

3) Prüfen (im Repo-Root, mit ausgefüllter .env.deploy)
     npm run deploy:verify

4) Container bauen & starten
     npm run docker:deploy:up

5) Healthchecks (auf dem VPS, Standard: nur 127.0.0.1)
     curl -sS http://127.0.0.1:3002/health
     curl -sS -o /dev/null -w "Web HTTP %{http_code}\n" http://127.0.0.1:3000/

6) Öffentlich mit HTTPS
     docs/DEPLOYMENT-HOSTINGER.md
     docs/GO-LIVE-CHECKLIST.md

Hinweis: NEXT_PUBLIC_* werden ins Web-Image gebaut — nach URL-Änderung immer „docker:deploy:up“ neu.
EOF

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
