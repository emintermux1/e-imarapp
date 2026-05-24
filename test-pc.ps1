$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "== E-Imar PC test (DEMO modu - API gerekmez)"
Write-Host ""
Write-Host "Tarayici otomatik acilacak: http://localhost:3001"
Write-Host "Canli API icin: npm run dev:all:open"
Write-Host "Durdurmak icin Ctrl+C"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js yok. https://nodejs.org adresinden kurun."
}

if (-not (Test-Path "node_modules")) { npm install }
if (-not (Test-Path "apps/e_imar_web/node_modules")) { npm install --prefix apps/e_imar_web }

node scripts/dev-web-demo.mjs --open
