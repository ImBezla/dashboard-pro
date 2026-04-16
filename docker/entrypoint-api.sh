#!/bin/sh
set -e
cd /app/apps/api
echo "Running Prisma migrate deploy…"
prisma migrate deploy
echo "Starting API…"
exec node dist/main.js
