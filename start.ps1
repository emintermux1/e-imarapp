$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "== E-Imar local launcher (PowerShell)"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js not found. Install from https://nodejs.org"
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing root dependencies..."
  npm install
}

if (-not (Test-Path "apps/e_imar_web/node_modules")) {
  Write-Host "Installing web dependencies..."
  npm install --prefix apps/e_imar_web
}

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env"
}

if (-not (Test-Path "apps/e_imar_web/.env")) {
  Copy-Item "apps/e_imar_web/.env.example" "apps/e_imar_web/.env"
  Write-Host "Created apps/e_imar_web/.env"
}

Write-Host ""
Write-Host "Starting API (:3000) and Web (:3001)..."
Write-Host "Open http://localhost:3001"
Write-Host ""

node scripts/dev-all.mjs
