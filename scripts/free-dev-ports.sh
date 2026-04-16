#!/usr/bin/env bash
# Standard-Ports für dashboardpro freigeben (Next.js 8000, Nest API 3002).
# Aufruf: bash scripts/free-dev-ports.sh   oder via npm run dev:fresh

set -euo pipefail

free_listen_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "${pids}" ]]; then
    return 0
  fi
  echo "[dashboardpro] Port ${port} ist belegt — beende PID(s): ${pids//$'\n'/ }"
  # shellcheck disable=SC2086
  kill ${pids} 2>/dev/null || true
  sleep 0.35
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "[dashboardpro] Port ${port} — erzwinge SIGKILL für: ${pids//$'\n'/ }"
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
  fi
}

free_listen_port 8000
free_listen_port 3002

echo "[dashboardpro] Ports 8000 (Web) und 3002 (API) sind frei."
echo "[dashboardpro] Im Browser: http://localhost:8000  (nicht :3000)"
