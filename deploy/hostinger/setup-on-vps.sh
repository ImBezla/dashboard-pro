#!/usr/bin/env bash
# Auf dem Hostinger-VPS per SSH ausführen (nicht auf dem Mac):
#   curl -fsSL …  ODER: Repo nach /var/www/dashboardpro legen, dann:
#   sudo bash deploy/hostinger/setup-on-vps.sh deine-domain.de /var/www/dashboardpro
#
# Schritt 1: nginx (HTTP) → Proxy zu Docker Web/API
# Schritt 2: Zertifikate (siehe Ende): certbot --nginx …
# Optional: --install-deps  installiert nginx + certbot + docker (Ubuntu).

set -euo pipefail

INSTALL_DEPS=false
if [[ "${1:-}" == "--install-deps" ]]; then
  INSTALL_DEPS=true
  shift
fi

MAIN_DOMAIN="${1:?Verwendung: sudo bash $0 [--install-deps] <hauptdomain.de> [projektverzeichnis]}"
PROJECT_DIR="${2:-/var/www/dashboardpro}"
WEB_PORT="${WEB_PORT:-3000}"
API_PORT="${API_PORT:-3002}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Bitte mit sudo ausführen: sudo bash $0 $*" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${TEMPLATE:-$SCRIPT_DIR/nginx-dashboardpro.conf.example}"
NGINX_SITE="/etc/nginx/sites-available/dashboardpro-${MAIN_DOMAIN}"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Vorlage fehlt: $TEMPLATE" >&2
  exit 1
fi

if [[ "$INSTALL_DEPS" == true ]]; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    DEBIAN_FRONTEND=noninteractive apt-get install -y nginx curl ca-certificates
    if ! command -v docker >/dev/null 2>&1; then
      curl -fsSL https://get.docker.com | sh
    fi
    apt-get install -y certbot python3-certbot-nginx
  else
    echo "Kein apt-get — Pakete bitte manuell installieren (nginx, docker, certbot)." >&2
  fi
fi

mkdir -p /var/www/certbot

sed \
  -e "s/@MAIN_DOMAIN@/${MAIN_DOMAIN}/g" \
  -e "s/@WEB_PORT@/${WEB_PORT}/g" \
  -e "s/@API_PORT@/${API_PORT}/g" \
  "$TEMPLATE" >"$NGINX_SITE"

ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/dashboardpro-${MAIN_DOMAIN}"

if [[ -f /etc/nginx/sites-enabled/default ]]; then
  echo "→ Hinweis: Standard-Site 'default' kann mit eurer Domain kollidieren — bei Bedarf:"
  echo "    rm /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx"
fi

nginx -t
systemctl reload nginx

if [[ "${DP_SKIP_DOCKER_HINT:-}" == "1" ]]; then
  echo "→ nginx aktiv: ${MAIN_DOMAIN} / api.${MAIN_DOMAIN} → 127.0.0.1:${WEB_PORT} bzw. :${API_PORT}"
else
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  nginx läuft (HTTP). Docker im Projektordner starten:"
  echo "    cd ${PROJECT_DIR}"
  echo "    cp -n .env.deploy.example .env.deploy   # falls noch keine .env.deploy"
  echo "    nano .env.deploy   # JWT_SECRET, FRONTEND_URL=https://${MAIN_DOMAIN}, NEXT_PUBLIC_*"
  echo "    docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d --build"
  echo ""
  echo "  TLS (DNS muss auf diesen Server zeigen):"
  echo "    certbot --nginx -d ${MAIN_DOMAIN} -d www.${MAIN_DOMAIN} -d api.${MAIN_DOMAIN}"
  echo ""
  echo "  .env.deploy Beispiel:"
  echo "    FRONTEND_URL=https://${MAIN_DOMAIN}"
  echo "    NEXT_PUBLIC_SITE_URL=https://${MAIN_DOMAIN}"
  echo "    NEXT_PUBLIC_API_URL=https://api.${MAIN_DOMAIN}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
