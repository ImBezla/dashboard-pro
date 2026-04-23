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
  # grep ohne Treffer darf bei pipefail + set -e nicht das ganze Skript beenden
  (grep -E "^[[:space:]]*$1=" "$ENV_FILE" 2>/dev/null || true) |
    head -1 |
    sed "s/^[[:space:]]*$1=//" |
    tr -d '\r' | tr -d '"' | tr -d "'"
}

check_nonempty JWT_SECRET
check_nonempty FRONTEND_URL
check_nonempty NEXT_PUBLIC_API_URL
check_nonempty NEXT_PUBLIC_SITE_URL
check_nonempty DATABASE_URL

fe_url="$(value_of FRONTEND_URL)"
site_url="$(value_of NEXT_PUBLIC_SITE_URL)"
api_url="$(value_of NEXT_PUBLIC_API_URL)"

# Öffentliche URLs: kein localhost, https (API: https oder /api für Single-Domain)
for key_val in "FRONTEND_URL|$fe_url" "NEXT_PUBLIC_SITE_URL|$site_url"; do
  key="${key_val%%|*}"
  val="${key_val#*|}"
  if [[ "$val" == *localhost* || "$val" == *127.0.0.1* ]]; then
    echo "FEHLER: ${key} darf für Live-Deploy kein localhost/127.0.0.1 enthalten (aktuell: ${val})." >&2
    exit 1
  fi
  if [[ "$val" != https://* ]]; then
    echo "FEHLER: ${key} muss mit https:// beginnen (aktuell: ${val})." >&2
    exit 1
  fi
done

if [[ "$api_url" == /api ]]; then
  :
elif [[ "$api_url" == https://* ]]; then
  :
else
  echo "FEHLER: NEXT_PUBLIC_API_URL muss https://… (Subdomain) oder /api (nginx Single-Domain) sein (aktuell: ${api_url})." >&2
  exit 1
fi

DB="$(value_of DATABASE_URL)"
if [[ "$DB" != postgresql://* && "$DB" != postgres://* ]]; then
  echo "DATABASE_URL muss mit postgresql:// oder postgres:// beginnen." >&2
  exit 1
fi
if [[ "$DB" == *"@db."*".supabase.co"* ]]; then
  echo "FEHLER: DATABASE_URL nutzt Supabase Direct (db.*.supabase.co) — oft nur IPv6; Docker auf VPS meist ohne IPv6 → Prisma P1001. Session Pooler (pooler.supabase.com) aus dem Dashboard verwenden. Siehe docs/SUPABASE.md." >&2
  exit 1
fi
if [[ "$DB" == *supabase.co* || "$DB" == *pooler.supabase.com* || "$DB" == *supabase.com* ]]; then
  if [[ "$DB" != *sslmode=require* ]]; then
    echo "FEHLER: DATABASE_URL für Supabase/Remote sollte sslmode=require enthalten (siehe docs/SUPABASE.md)." >&2
    exit 1
  fi
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

fe="$fe_url"
apiu="$api_url"
if [[ "$fe" == https://* ]] && [[ "$apiu" == http://* ]]; then
  echo "FEHLER: FRONTEND_URL ist https, NEXT_PUBLIC_API_URL ist http — Mixed Content im Browser. API-URL auf https:// oder /api setzen." >&2
  exit 1
fi

skip_ev="$(value_of SKIP_EMAIL_VERIFICATION | tr '[:upper:]' '[:lower:]')"
if [[ "$skip_ev" != "true" ]]; then
  has_smtp_host=false
  has_gmail=false
  has_resend=false
  grep -qE '^[[:space:]]*SMTP_HOST=[^[:space:]]' "$ENV_FILE" && has_smtp_host=true
  grep -qE '^[[:space:]]*RESEND_API_KEY=[^[:space:]]' "$ENV_FILE" && has_resend=true
  if grep -qE '^[[:space:]]*SMTP_USER=[^[:space:]]' "$ENV_FILE"; then
    if grep -qE '^[[:space:]]*GMAIL_APP_PASSWORD=[^[:space:]]' "$ENV_FILE" ||
      grep -qE '^[[:space:]]*SMTP_PASS=[^[:space:]]' "$ENV_FILE"; then
      has_gmail=true
    fi
  fi
  if [[ "$has_smtp_host" != "true" && "$has_gmail" != "true" && "$has_resend" != "true" ]]; then
    echo "FEHLER: Ohne E-Mail-Versand (SMTP_HOST oder SMTP_USER+Passwort oder RESEND_API_KEY) schlägt die Registrierung fehl. Entweder E-Mail konfigurieren oder nur für geschlossene Tests SKIP_EMAIL_VERIFICATION=true setzen." >&2
    exit 1
  fi
fi

echo "→ .env.deploy OK: $ENV_FILE"
