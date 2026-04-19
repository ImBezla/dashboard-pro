#!/usr/bin/env bash
# Prüft .env.deploy vor docker compose (lokal oder auf dem VPS).
# Aufruf: bash scripts/verify-env-deploy.sh [.env.deploy]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.deploy}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Datei fehlt: $ENV_FILE" >&2
  echo "Kopiere: cp .env.deploy.example .env.deploy && Editor" >&2
  exit 1
fi

check_nonempty() {
  local key="$1"
  if ! grep -qE "^[[:space:]]*${key}=[^[:space:]]" "$ENV_FILE"; then
    echo "Fehlt oder leer: ${key}" >&2
    exit 1
  fi
}

value_of() {
  grep -E "^[[:space:]]*$1=" "$ENV_FILE" | head -1 | sed "s/^[[:space:]]*$1=//" | tr -d '\r' | tr -d '"' | tr -d "'"
}

check_nonempty JWT_SECRET
check_nonempty FRONTEND_URL
check_nonempty NEXT_PUBLIC_API_URL
check_nonempty NEXT_PUBLIC_SITE_URL
check_nonempty DATABASE_URL

DB="$(value_of DATABASE_URL)"
if [[ "$DB" != postgresql://* && "$DB" != postgres://* ]]; then
  echo "DATABASE_URL muss mit postgresql:// oder postgres:// beginnen (Supabase Direct URI)." >&2
  exit 1
fi

JWT="$(value_of JWT_SECRET)"
if [[ ${#JWT} -lt 24 ]]; then
  echo "JWT_SECRET ist zu kurz (mindestens ~24 Zeichen empfohlen)." >&2
  exit 1
fi
if [[ "$JWT" == "change-me-in-production" || "$JWT" == "your-secret-key-change-in-production" ]]; then
  echo "JWT_SECRET ist noch ein Platzhalter — bitte durch ein zufälliges Geheimnis ersetzen." >&2
  exit 1
fi

warn_https() {
  local key="$1"
  local url
  url="$(value_of "$key")"
  if [[ "$url" != https://* ]] && [[ "$url" != http://localhost* ]] && [[ "$url" != http://127.0.0.1* ]]; then
    echo "Hinweis: ${key} sollte in Produktion mit https:// beginnen (aktuell: ${url})" >&2
  fi
}
warn_https FRONTEND_URL
warn_https NEXT_PUBLIC_API_URL
warn_https NEXT_PUBLIC_SITE_URL

echo "→ .env.deploy OK: $ENV_FILE"
