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

echo "==> API-Container starten …"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d api

echo ""
echo "Fertig. 90–120 s warten (migrate deploy), dann prüfen:"
echo "  curl -sS http://127.0.0.1:3002/health"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE ps"
echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs --tail=80 api"
echo ""
echo "Bei P3009: zuerst Supabase public wipen (scripts/supabase-wipe-public-schema.sql) oder"
echo "  bash scripts/prisma-resolve-failed-migration.sh rolled-back <MIGRATIONSNAME>"
echo "Dann dieses Skript erneut ausführen."
