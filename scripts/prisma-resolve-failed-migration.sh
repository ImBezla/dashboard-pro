#!/usr/bin/env bash
# Markiert eine fehlgeschlagene Prisma-Migration in der Ziel-DB (P3009 / migrate deploy blockiert).
# Läuft im API-Image, damit dieselbe Prisma-Version und DATABASE_URL wie beim Deploy gelten.
#
# Aufruf (Repo-Root, z. B. auf dem VPS):
#   bash scripts/prisma-resolve-failed-migration.sh rolled-back 20251117120204_init
#   bash scripts/prisma-resolve-failed-migration.sh applied 20251117120204_init
#
# Danach API neu starten:
#   docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d api
#
# --rolled-back: Migration war fehlgeschlagen / soll erneut mit migrate deploy angewendet werden.
# --applied:     Migration ist faktisch schon in der DB (nur Eintrag korrigieren) — nur nach Prüfung!
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.deploy}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"
ACTION="${1:-}"
MIGRATION="${2:-}"

usage() {
  cat <<'USAGE' >&2
Aufruf:
  bash scripts/prisma-resolve-failed-migration.sh rolled-back <migration_name>
  bash scripts/prisma-resolve-failed-migration.sh applied   <migration_name>

Umgebungsvariablen (optional):
  ENV_FILE=.env.deploy
  COMPOSE_FILE=docker-compose.deploy.yml

Beispiel (typisch bei P3009 nach fehlgeschlagenem init):
  bash scripts/prisma-resolve-failed-migration.sh rolled-back 20251117120204_init
USAGE
  exit 1
}

if [[ "$ACTION" != "rolled-back" && "$ACTION" != "applied" ]]; then
  usage
fi
if [[ -z "$MIGRATION" ]]; then
  usage
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Fehler: $ENV_FILE nicht gefunden (Repo-Root: $ROOT)." >&2
  exit 1
fi
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Fehler: $COMPOSE_FILE nicht gefunden." >&2
  exit 1
fi

FLAG="--rolled-back"
if [[ "$ACTION" == "applied" ]]; then
  FLAG="--applied"
fi

echo "→ prisma migrate resolve $FLAG \"$MIGRATION\" (Compose: $COMPOSE_FILE, env: $ENV_FILE)"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm --no-deps --entrypoint "" api \
  sh -lc "cd /app/apps/api && exec /app/node_modules/.bin/prisma migrate resolve $FLAG \"$MIGRATION\" --schema=prisma/schema.prisma"

echo ""
echo "Fertig. API neu starten:"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d api"
echo "  curl -sS http://127.0.0.1:3002/health"
