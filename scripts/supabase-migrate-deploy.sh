#!/usr/bin/env bash
# Wendet Prisma-Migrationen auf die in DATABASE_URL konfigurierte Postgres-Instanz an
# (z. B. Supabase Session Pooler oder Direct). Keine Secrets in Dateien speichern.
#
# Aufruf:
#   DATABASE_URL='postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require' \
#     bash scripts/supabase-migrate-deploy.sh
#
# Siehe: docs/SUPABASE.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Fehler: DATABASE_URL ist nicht gesetzt." >&2
  echo "Beispiel (ein Zeile, Passwort ersetzen):" >&2
  echo "  export DATABASE_URL='postgresql://postgres.[REF]:…@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require'" >&2
  echo "  bash scripts/supabase-migrate-deploy.sh" >&2
  exit 1
fi

if [[ "$DATABASE_URL" != postgresql://* && "$DATABASE_URL" != postgres://* ]]; then
  echo "Fehler: DATABASE_URL muss mit postgresql:// oder postgres:// beginnen." >&2
  exit 1
fi

cd "$ROOT/apps/api"
echo "→ prisma migrate deploy (Schema: prisma/schema.prisma)"
npx prisma migrate deploy
