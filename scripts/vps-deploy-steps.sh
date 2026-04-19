#!/usr/bin/env bash
# Zeigt die Reihenfolge für VPS-Deploy (Docker + Supabase). Optional: .env.deploy prüfen.
# Aufruf: bash scripts/vps-deploy-steps.sh   oder   npm run deploy:vps
#         bash scripts/vps-deploy-steps.sh --verify   (nur wenn .env.deploy existiert)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cat <<'EOF'
=== DashboardPro — VPS hochladen / live schalten ===

WICHTIG — zwei Rechner
  • Befehle mit „ssh root@…“ oder „cd /root“: auf dem VPS ausführen (nach ssh), nicht auf dem Mac.
  • „cd /root“ gibt es auf dem Mac nicht — /root ist das Home von root auf Linux.

Voraussetzungen auf dem VPS
  • Ubuntu o. Ä., SSH
  • Docker + Plugin „docker compose“
  • Optional: nginx/Caddy + TLS (öffentliche https-URLs)

1) Code auf den Server — ZUERST (sonst schlägt scp fehl: „No such file or directory“)

  Vom Mac aus, einmalig (klont nach /root/dashboardpro auf dem VPS):
    ssh root@72.61.95.246 "git clone https://github.com/ImBezla/dashboard-pro.git dashboardpro && ls -la dashboardpro/docker-compose.deploy.yml"

  Wenn der Ordner schon existiert:
    ssh root@72.61.95.246 "cd dashboardpro && git pull"

  Oder interaktiv auf dem VPS:
    ssh root@72.61.95.246
    cd /root
    git clone https://github.com/ImBezla/dashboard-pro.git dashboardpro
    cd dashboardpro && git checkout main && git pull

  Branch wechseln falls nötig:
    git checkout cursor/postgresql-supabase-migration   # Beispiel

  B) Ohne Git — Bundle auf dem Mac:
     npm run dist:deploy
     → dist/deploy/ per scp/rsync auf den VPS, dann dort cd …

2) Umgebung (.env.deploy — nicht ins Git committen)
     Lokal am Mac: .env.deploy pflegen, dann ERST NACH Schritt 1 hochladen:

     scp .env.deploy root@72.61.95.246:/root/dashboardpro/.env.deploy

     (Wenn der Klon woanders liegt: Zielpfad anpassen, auf dem VPS finden mit:
      ssh root@72.61.95.246 "find /root /home -maxdepth 5 -name docker-compose.deploy.yml 2>/dev/null")

     Variablen in .env.deploy u. a.:
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

echo ""
echo "→ Nur wenn Schritt 1 (clone) auf dem VPS schon geklappt hat — .env.deploy hochladen:"
if [[ -f "$ROOT/.env.deploy" ]]; then
  echo "  scp \"$ROOT/.env.deploy\" root@72.61.95.246:/root/dashboardpro/.env.deploy"
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
