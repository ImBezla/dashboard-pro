#!/bin/sh
set -e
cd /app/apps/api

# Prisma-CLI (Workspaces können unter /app oder apps/api liegen)
PRISMA_CMD=""
for candidate in /app/node_modules/.bin/prisma /app/apps/api/node_modules/.bin/prisma; do
  if [ -x "$candidate" ]; then
    PRISMA_CMD=$candidate
    break
  fi
done
if [ -z "$PRISMA_CMD" ] && command -v prisma >/dev/null 2>&1; then
  PRISMA_CMD=prisma
fi
if [ -z "$PRISMA_CMD" ]; then
  echo "Fehler: kein prisma-CLI (erwartet unter /app/node_modules/.bin oder apps/api)." >&2
  exit 1
fi

echo "[api-entrypoint] $(date -u +%Y-%m-%dT%H:%M:%SZ) prisma CLI: $PRISMA_CMD"
"$PRISMA_CMD" --version
echo "[api-entrypoint] Hinweis: Port 3002 antwortet erst nach migrate deploy und Node-Start (curl vorher: connection refused)."

if [ "${API_SKIP_PRISMA_MIGRATE:-}" = "true" ]; then
  echo "[api-entrypoint] WARNUNG: API_SKIP_PRISMA_MIGRATE=true — migrate deploy wird übersprungen (nur Notfall)." >&2
else
  echo "[api-entrypoint] $(date -u +%Y-%m-%dT%H:%M:%SZ) Prisma migrate deploy start (schema prisma/schema.prisma)"
  if [ "${PRISMA_DEBUG_MIGRATE:-}" = "true" ]; then
    export DEBUG="${DEBUG:-prisma:migrate*}"
    echo "[api-entrypoint] PRISMA_DEBUG_MIGRATE aktiv (DEBUG=$DEBUG)"
  fi

  TO="${PRISMA_MIGRATE_DEPLOY_TIMEOUT_SEC:-900}"
  set +e
  if command -v stdbuf >/dev/null 2>&1 && command -v timeout >/dev/null 2>&1 && [ "$TO" -gt 0 ] 2>/dev/null; then
    timeout "$TO" stdbuf -oL -eL "$PRISMA_CMD" migrate deploy --schema=prisma/schema.prisma
    code=$?
  elif command -v timeout >/dev/null 2>&1 && [ "$TO" -gt 0 ] 2>/dev/null; then
    timeout "$TO" "$PRISMA_CMD" migrate deploy --schema=prisma/schema.prisma
    code=$?
  else
    "$PRISMA_CMD" migrate deploy --schema=prisma/schema.prisma
    code=$?
  fi
  set -e

  if [ "$code" -eq 124 ]; then
    echo "[api-entrypoint] Fehler: prisma migrate deploy Timeout nach ${TO}s (evtl. DB-Lock, langsames Volume, blockiertes Netz)." >&2
    echo "[api-entrypoint] Tipp: docker compose logs -f api; DATABASE_URL / Netzwerk zur DB prüfen." >&2
    exit 124
  fi
  if [ "$code" -ne 0 ]; then
    exit "$code"
  fi
  echo "[api-entrypoint] $(date -u +%Y-%m-%dT%H:%M:%SZ) Prisma migrate deploy fertig"
fi

echo "[api-entrypoint] Node-Start…"
if [ -f dist/main.js ]; then
  exec node dist/main.js
elif [ -f dist/src/main.js ]; then
  exec node dist/src/main.js
else
  echo "Fehler: kein Einstieg (dist/main.js oder dist/src/main.js)." >&2
  ls -la dist 2>/dev/null || ls -la . >&2
  exit 1
fi
