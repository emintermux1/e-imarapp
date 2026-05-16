#!/usr/bin/env bash
# Full-repository verification for CI and local development.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAILURES=0
fail() { echo "[fail] $*" >&2; FAILURES=$((FAILURES + 1)); }
warn() { echo "[warn] $*" >&2; }

echo "=========================================="
echo " e-İmar repository health check"
echo " Root: $ROOT_DIR"
echo "=========================================="

echo ""
echo "== Node / npm =="
node --version
npm --version

echo ""
echo "== Root TypeScript (NestJS / shared) =="
npm run typecheck || fail "root typecheck"

echo ""
echo "== Root unit tests =="
npm test || fail "root jest"

echo ""
echo "== Map provider env (optional) =="
npm run map:check-keys 2>/dev/null || warn "map:check-keys skipped or unset keys"

echo ""
echo "== Python FastAPI (syntax) =="
if command -v python3 >/dev/null 2>&1; then
  python3 -m compileall -q "$ROOT_DIR/app" || fail "python compileall app/"
else
  warn "python3 not found; skipping FastAPI compileall"
fi

echo ""
echo "== Canonical frontend (apps/e_imar_web) =="
if [[ -f "$ROOT_DIR/apps/e_imar_web/package.json" ]]; then
  (
    cd "$ROOT_DIR/apps/e_imar_web"
    npm install --no-audit --no-fund >/dev/null
    npm run typecheck
    npm run lint -- --max-warnings 999
    npm run build
  ) || fail "apps/e_imar_web typecheck/lint/build"
else
  fail "apps/e_imar_web/package.json missing"
fi

echo ""
echo "=========================================="
if [[ "$FAILURES" -eq 0 ]]; then
  echo " Repository health: PASSED"
  exit 0
fi
echo " Repository health: FAILED ($FAILURES required step(s))"
exit 1
