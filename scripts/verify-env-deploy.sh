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
  echo "DATABASE_URL muss mit postgresql:// oder postgres:// beginnen." >&2
  exit 1
fi
if [[ "$DB" == *"@db."*".supabase.co"* ]]; then
  echo "Hinweis: DATABASE_URL nutzt Supabase Direct (db.*.supabase.co) — oft nur IPv6. Docker-Container auf vielen VPS haben kein IPv6 → Prisma P1001. Session Pooler aus dem Dashboard verwenden (pooler.supabase.com). Siehe docs/SUPABASE.md." >&2
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

fe="$(value_of FRONTEND_URL)"
apiu="$(value_of NEXT_PUBLIC_API_URL)"
if [[ "$fe" == https://* ]] && [[ "$apiu" == http://* ]]; then
  if [[ "$apiu" != http://localhost* && "$apiu" != http://127.0.0.1* ]]; then
    echo "Hinweis: FRONTEND_URL ist https, NEXT_PUBLIC_API_URL ist http (außer localhost) — Browser blockiert oft Mixed Content. API-URL auf https:// setzen." >&2
  fi
fi

skip_ev="$(value_of SKIP_EMAIL_VERIFICATION | tr '[:upper:]' '[:lower:]')"
if [[ "$skip_ev" != "true" ]]; then
  has_smtp_host=false
  has_gmail=false
  grep -qE '^[[:space:]]*SMTP_HOST=[^[:space:]]' "$ENV_FILE" && has_smtp_host=true
  if grep -qE '^[[:space:]]*SMTP_USER=[^[:space:]]' "$ENV_FILE"; then
    if grep -qE '^[[:space:]]*GMAIL_APP_PASSWORD=[^[:space:]]' "$ENV_FILE" ||
      grep -qE '^[[:space:]]*SMTP_PASS=[^[:space:]]' "$ENV_FILE"; then
      has_gmail=true
    fi
  fi
  if [[ "$has_smtp_host" != "true" && "$has_gmail" != "true" ]]; then
    echo "Hinweis: Weder SMTP_HOST noch (SMTP_USER + GMAIL_APP_PASSWORD/SMTP_PASS) gesetzt — Registrierung/E-Mail bricht ohne SKIP_EMAIL_VERIFICATION=true ab." >&2
  fi
fi

echo "→ .env.deploy OK: $ENV_FILE"
