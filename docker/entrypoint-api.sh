#!/bin/sh
set -e
cd /app/apps/api
echo "Running Prisma migrate deploy…"
prisma migrate deploy
echo "Starting API…"
if [ -f dist/main.js ]; then
  exec node dist/main.js
elif [ -f dist/src/main.js ]; then
  exec node dist/src/main.js
else
  echo "Fehler: kein Einstieg (dist/main.js oder dist/src/main.js)." >&2
  ls -la dist 2>/dev/null || ls -la . >&2
  exit 1
fi
