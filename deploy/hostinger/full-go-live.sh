#!/usr/bin/env bash
# Orchestrierung auf dem VPS (nachdem das Repo unter ZIELVERZEICHNIS liegt und .env.deploy gefüllt ist).
#
#   cd /var/www/dashboardpro
#   sudo bash deploy/hostinger/full-go-live.sh deine-domain.de
#
# Ablauf: 1) .env.deploy prüfen  2) nginx (HTTP)  3) Docker Stack bauen & starten  4) Hinweis Certbot

set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Mit sudo ausführen: sudo bash $0 <domain.de>" >&2
  exit 1
fi

MAIN_DOMAIN="${1:?Verwendung: sudo bash $0 <hauptdomain.de>}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

if [[ ! -f .env.deploy ]]; then
  echo "Fehlt: $REPO/.env.deploy — zuerst: cp .env.deploy.example .env.deploy && ausfüllen" >&2
  exit 1
fi

echo "== 1/3 Umgebungsvariablen =="
bash "$REPO/scripts/verify-env-deploy.sh" "$REPO/.env.deploy"

echo "== 2/3 nginx (HTTP, Proxy zu Docker) =="
DP_SKIP_DOCKER_HINT=1 bash "$REPO/deploy/hostinger/setup-on-vps.sh" "$MAIN_DOMAIN" "$REPO"

echo "== 3/3 Docker Compose =="
docker compose --env-file "$REPO/.env.deploy" -f "$REPO/docker-compose.deploy.yml" up -d --build

echo ""
echo "Fertig. TLS:"
if [[ "${TEMPLATE:-}" == *"single-domain"* ]]; then
  echo "  certbot --nginx -d ${MAIN_DOMAIN} -d www.${MAIN_DOMAIN}"
else
  echo "  certbot --nginx -d ${MAIN_DOMAIN} -d www.${MAIN_DOMAIN} -d api.${MAIN_DOMAIN}"
fi
echo ""
