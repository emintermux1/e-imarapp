$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "== E-Imar DEMO (web only, no API required)"
Write-Host "Browser: http://localhost:3001"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is required. Install from https://nodejs.org"
}

if (-not (Test-Path node_modules)) { npm install }
if (-not (Test-Path apps/e_imar_web/node_modules)) { npm install --prefix apps/e_imar_web }

node scripts/dev-web-demo.mjs --open
