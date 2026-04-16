#!/usr/bin/env bash
# Erzeugt dist/deploy/ — Quellbaum für Docker-Deploy ohne node_modules / .next (wird auf dem Server gebaut).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/deploy"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync nicht gefunden. Auf macOS/Linux: rsync installieren oder per git clone auf dem Server deployen." >&2
  exit 1
fi

echo "→ Ziel: $OUT"
rm -rf "$OUT"
mkdir -p "$OUT"

rsync -a \
  --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'apps/web/.next' \
  --exclude 'apps/api/dist' \
  --exclude '.turbo' \
  --exclude 'dist/' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.deploy' \
  --exclude 'apps/web/.env.local' \
  --exclude 'apps/api/.env' \
  "$ROOT/" "$OUT/"

cat > "$OUT/README-DEPLOY-BUNDLE.txt" << 'EOF'
Dashboard Pro — Deploy-Bundle (dist/deploy)

Auf dem Server (VPS):
  1. Diesen Ordner nach z. B. /var/www/dashboardpro kopieren (oder ZIP entpacken).
  2. cp .env.deploy.example .env.deploy && Editor: JWT_SECRET, FRONTEND_URL, NEXT_PUBLIC_*, DATABASE_URL
  3. docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build

Kein public_html — Hostinger VPS: deploy/hostinger/README.md, full-go-live.sh, docs/GO-LIVE-CHECKLIST.md
EOF

echo "→ Fertig. Größe (ungefähr):"
du -sh "$OUT"
