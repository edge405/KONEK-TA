#!/usr/bin/env bash
# start.sh — Django backend + React frontend

set -euo pipefail

# -------- Paths --------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# -------- Config (override with env vars) --------
DJANGO_PORT="${DJANGO_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
DJANGO_HOST="${DJANGO_HOST:-0.0.0.0}"

# -------- Helpers --------
start_backend() {
  echo "==> Starting Django backend..."
  cd "$SCRIPT_DIR/konekta-backend/konekta"

  # Start Django dev server (background)
  python manage.py runserver "${DJANGO_HOST}:${DJANGO_PORT}" &
  BACKEND_PID=$!
  echo "Django running at http://${DJANGO_HOST}:${DJANGO_PORT} (pid: $BACKEND_PID)"
}

start_frontend() {
  echo "==> Starting React frontend..."
  cd "$SCRIPT_DIR/konekta-frontend"

  # Start React dev server (background)
  npm run dev &
  FRONTEND_PID=$!
  echo "React dev server starting on http://localhost:${FRONTEND_PORT} (pid: $FRONTEND_PID)"
}

# -------- Shutdown trap --------
cleanup() {
  echo ""
  echo "==> Shutting down..."
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

# -------- Run --------
start_backend
start_frontend

echo ""
echo "==============================================="
echo " Backend: http://${DJANGO_HOST}:${DJANGO_PORT}"
echo " Frontend: http://localhost:${FRONTEND_PORT}"
echo " Press Ctrl+C to stop both."
echo "==============================================="

# Keep script alive to maintain trap until children exit
wait
