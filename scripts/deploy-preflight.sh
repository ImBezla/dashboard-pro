#!/usr/bin/env bash
# Ein Befehl vor dem Upload: .env.deploy prüfen + kurze Erinnerung VPS/DNS.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== 1) .env.deploy prüfen =="
bash scripts/verify-env-deploy.sh

echo ""
echo "== 2) Nächste Schritte (manuell) =="
cat <<'EOF'
• .env.deploy auf den VPS kopieren (scp), Repo dort (git clone/pull).
• DNS: A/AAAA für Web- und API-Host auf die VPS-IP.
• TLS: nginx/Caddy vor 127.0.0.1:3000 (Web) und :3002 (API).
• Auf dem VPS im Repo-Root:
    docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build
• Test: https://… im Browser, Registrierung + E-Mail-Bestätigung.

Details: docs/DEPLOYMENT.md · Hostinger: docs/DEPLOYMENT-HOSTINGER.md
Vollständige Befehlsfolge: npm run deploy:vps
EOF
