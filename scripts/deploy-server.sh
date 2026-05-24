#!/usr/bin/env bash
# Production deploy helper for a VPS running Docker + systemd.
# Usage on server:
#   export DEPLOY_DIR=/opt/e-imarapp
#   bash scripts/deploy-server.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-$ROOT_DIR}"

cd "$DEPLOY_DIR"

echo "==> Pull latest main"
git fetch origin main
git checkout main
git pull --ff-only origin main

echo "==> Install dependencies"
npm ci
npm ci --prefix apps/e_imar_web

echo "==> Build backend + web"
npm run build
npm run build --prefix apps/e_imar_web

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "==> Refresh platform services"
  docker compose up -d postgres redis
fi

echo "==> Restart API (systemd example: e-imar-api.service)"
if systemctl is-active --quiet e-imar-api 2>/dev/null; then
  sudo systemctl restart e-imar-api
else
  echo "    systemd unit e-imar-api not found; start manually: npm run start"
fi

echo "==> Restart web (systemd example: e-imar-web.service)"
if systemctl is-active --quiet e-imar-web 2>/dev/null; then
  sudo systemctl restart e-imar-web
else
  echo "    systemd unit e-imar-web not found; start manually: npm run start --prefix apps/e_imar_web"
fi

echo "==> Health checks"
curl -fsS "http://127.0.0.1:3000/health" >/dev/null || echo "warn: API /health not reachable on :3000"
curl -fsS "http://127.0.0.1:3001/healthz" >/dev/null || echo "warn: web /healthz not reachable on :3001"

echo "Deploy complete."
