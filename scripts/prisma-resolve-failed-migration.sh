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
#
# Schleife vermeiden: Nach --rolled-back führt der nächste migrate deploy die Migration erneut aus.
# Wenn dabei SQL fehlschlägt (z. B. "relation User already exists"), entsteht wieder P3009.
# Dann docs/SUPABASE.md → „P3009 / init — Schleife“ (Schema public wipen oder --applied).
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
echo "Fertig. Auf dem VPS ist kein npm nötig — nur docker compose."
echo "API neu starten, dann warten (migrate deploy kann 1–3 Minuten dauern), dann prüfen:"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d api"
echo "  sleep 90"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE ps"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs --tail=40 api"
echo "  curl -sS http://127.0.0.1:3002/health"
echo ""
echo "Hinweis: curl sofort nach up zeigt oft connection refused — Node lauscht erst nach erfolgreichem migrate deploy."
echo "Wenn Logs „relation … already exists“: Init war teilweise drin — nicht erneut rolled-back; Supabase SQL / Prisma-Doku migrate-resolve."
