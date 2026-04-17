#!/bin/sh
set -e
cd /app/apps/api

# Prisma-CLI: in Production aus node_modules (siehe package.json dependencies), Fallback global (ältere Images).
if [ -x /app/node_modules/.bin/prisma ]; then
  PRISMA_CMD=/app/node_modules/.bin/prisma
elif command -v prisma >/dev/null 2>&1; then
  PRISMA_CMD=prisma
else
  echo "Fehler: kein prisma-CLI gefunden (/app/node_modules/.bin/prisma)." >&2
  exit 1
fi

echo "[api-entrypoint] $(date -u +%Y-%m-%dT%H:%M:%SZ) Prisma migrate deploy start (schema prisma/schema.prisma)"
"$PRISMA_CMD" migrate deploy --schema=prisma/schema.prisma
echo "[api-entrypoint] $(date -u +%Y-%m-%dT%H:%M:%SZ) Prisma migrate deploy fertig"
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
