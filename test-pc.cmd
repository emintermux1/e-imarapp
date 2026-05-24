@echo off
setlocal
cd /d "%~dp0"

echo == E-Imar PC test (API + Web + tarayici)
echo.
echo 1) Proje klasorunde oldugunuzdan emin olun
echo 2) Tarayici otomatik acilacak: http://localhost:3001
echo 3) Durdurmak icin bu pencerede Ctrl+C
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js yok. https://nodejs.org adresinden kurun.
  exit /b 1
)

if not exist node_modules call npm install
if not exist apps\e_imar_web\node_modules call npm install --prefix apps\e_imar_web
if not exist .env copy /Y .env.example .env >nul
if not exist apps\e_imar_web\.env copy /Y apps\e_imar_web\.env.example apps\e_imar_web\.env >nul

node scripts\dev-all.mjs --open
