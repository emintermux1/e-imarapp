$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "== E-Imar PC test (API + Web + tarayici)"
Write-Host ""
Write-Host "Tarayici otomatik acilacak: http://localhost:3001"
Write-Host "Durdurmak icin Ctrl+C"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js yok. https://nodejs.org adresinden kurun."
}

if (-not (Test-Path "node_modules")) { npm install }
if (-not (Test-Path "apps/e_imar_web/node_modules")) { npm install --prefix apps/e_imar_web }
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
if (-not (Test-Path "apps/e_imar_web/.env")) { Copy-Item "apps/e_imar_web/.env.example" "apps/e_imar_web/.env" }

node scripts/dev-all.mjs --open
