#!/usr/bin/env bash
# Full-repository verification for CI and local development.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAILURES=0
fail() { echo "[fail] $*" >&2; FAILURES=$((FAILURES + 1)); }
warn() { echo "[warn] $*" >&2; }
run_required() {
  local label="$1"
  shift
  "$@" || fail "$label"
}
run_optional() {
  local label="$1"
  shift
  "$@" || warn "$label"
}

WEB_DIR="$ROOT_DIR/apps/e_imar_web"
INSTALL_CMD="npm ci"
WEB_INSTALL_CMD="npm ci"
if [[ "${REPO_HEALTH_NPM_INSTALL:-1}" == "0" ]]; then
  INSTALL_CMD="npm install --no-audit --no-fund"
  WEB_INSTALL_CMD="npm install --no-audit --no-fund"
else
  if [[ ! -f "$ROOT_DIR/package-lock.json" ]]; then
    INSTALL_CMD="npm install --no-audit --no-fund"
  fi
  if [[ ! -f "$WEB_DIR/package-lock.json" ]]; then
    WEB_INSTALL_CMD="npm install --no-audit --no-fund"
  fi
fi

if [[ "${REPO_HEALTH_SKIP_INSTALL:-0}" == "1" ]]; then
  INSTALL_CMD=":"
  WEB_INSTALL_CMD=":"
fi

echo "=========================================="
echo " e-İmar repository health check"
echo " Root: $ROOT_DIR"
echo "=========================================="

echo ""
echo "== Node / npm =="
node --version
npm --version

echo ""
echo "== Root dependencies =="
eval "$INSTALL_CMD" >/dev/null

echo ""
echo "== Canonical web dependencies (apps/e_imar_web) =="
if [[ -f "$WEB_DIR/package.json" ]]; then
  (
    cd "$WEB_DIR"
    eval "$WEB_INSTALL_CMD" >/dev/null
  ) || fail "apps/e_imar_web dependency install"
else
  fail "apps/e_imar_web/package.json missing"
fi

echo ""
echo "== Root TypeScript (backend / shared) =="
run_required "root typecheck" npm run typecheck

echo ""
echo "== Root backend build =="
run_required "root build" npm run build

echo ""
echo "== Root Jest tests =="
run_required "root jest" npm test

echo ""
echo "== Production demo-fallback guardrail =="
run_required "web:production-guardrails" npm run web:production-guardrails

echo ""
echo "== OpenAPI contract export/generate =="
run_required "openapi:generate" npm run openapi:generate

echo ""
echo "== Map provider env (optional) =="
run_optional "map:check-keys skipped or unset keys" npm run map:check-keys

echo ""
echo "== Python FastAPI (syntax) =="
if command -v python3 >/dev/null 2>&1; then
  run_required "python compileall app/" python3 -m compileall -q "$ROOT_DIR/app"
else
  warn "python3 not found; skipping FastAPI compileall"
fi

echo ""
echo "== Canonical product web app (apps/e_imar_web) =="
if [[ -f "$WEB_DIR/package.json" ]]; then
  (
    cd "$WEB_DIR"
    npm run typecheck
    npm run lint -- --max-warnings 999
    npm run build
  ) || fail "apps/e_imar_web typecheck/lint/build"
else
  fail "apps/e_imar_web/package.json missing"
fi

if [[ "${REPO_HEALTH_WEB_SMOKE:-1}" == "1" ]]; then
  echo ""
  echo "== Canonical product web smoke =="
  run_required "apps/e_imar_web smoke" npm run web:smoke
fi

if command -v docker >/dev/null 2>&1; then
  echo ""
  echo "== Docker compose config (non-starting) =="
  run_required "docker compose config" docker compose config --quiet
else
  warn "docker not found; skipping docker compose config"
fi

echo ""
echo "=========================================="
if [[ "$FAILURES" -eq 0 ]]; then
  echo " Repository health: PASSED"
  exit 0
fi
echo " Repository health: FAILED ($FAILURES required step(s))"
exit 1
