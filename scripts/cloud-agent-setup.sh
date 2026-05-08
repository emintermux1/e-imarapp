#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking Node.js toolchain"
node --version
npm --version

echo "==> Installing locked npm dependencies"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

if [[ ! -f .env ]]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "==> Starting local platform services"
  docker compose up -d postgres redis minio opensearch pg_tileserv prometheus grafana
else
  echo "==> Docker daemon is unavailable; skipping compose startup"
  echo "    Start Docker-enabled agents or run: docker compose up -d"
fi

echo "==> Running verification"
npm run typecheck
npm test

echo "==> Cloud agent setup complete"
