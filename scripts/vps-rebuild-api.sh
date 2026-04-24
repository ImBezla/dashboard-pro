#!/usr/bin/env bash
# Auf dem VPS im Repo-Root ausführen (nach git pull, wenn prisma/migrations geändert wurde).
# Die Migration-SQL liegt IM Docker-Image — ohne Re-Build nutzt der Container alte Dateien.
#
# Optional: ENV_FILE=.env.deploy COMPOSE_FILE=docker-compose.deploy.yml (Defaults)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.deploy}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Fehler: $ENV_FILE nicht gefunden (cwd: $ROOT)." >&2
  exit 1
fi
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Fehler: $COMPOSE_FILE nicht gefunden." >&2
  exit 1
fi

echo "==> API-Image neu bauen (Prisma-Migrations aus dem aktuellen Arbeitsbaum) …"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --no-cache api

# P3009: migrate deploy startet erst nach resolve. Image zuerst bauen (korrigierte .sql),
# dann optional resolve, dann up — sonst läuft up sofort wieder in denselben Fehler.
if [[ -n "${PRISMA_RESOLVE_ROLLED_BACK:-}" ]]; then
  echo "==> prisma migrate resolve --rolled-back \"$PRISMA_RESOLVE_ROLLED_BACK\" …"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm --no-deps --entrypoint "" api \
    sh -lc "cd /app/apps/api && exec /app/node_modules/.bin/prisma migrate resolve --rolled-back \"$PRISMA_RESOLVE_ROLLED_BACK\" --schema=prisma/schema.prisma"
fi

echo "==> API-Container starten …"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d api

echo ""
echo "Fertig. 90–120 s warten (migrate deploy), dann prüfen:"
echo "  curl -sS http://127.0.0.1:3002/health"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE ps"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs --tail=80 api"
echo ""
echo "Bei P3009 nach fehlgeschlagener Migration (ein Befehl, nach git pull mit Fix):"
echo "  PRISMA_RESOLVE_ROLLED_BACK=<MIGRATIONSNAME> bash scripts/vps-rebuild-api.sh"
echo "Oder manuell: bash scripts/prisma-resolve-failed-migration.sh rolled-back <NAME> → dann erneut build+up."
echo "Halb kaputtes Schema: scripts/supabase-wipe-public-schema.sql in Supabase SQL, dann erneut deploy."
