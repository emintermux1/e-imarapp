@echo off
setlocal
cd /d "%~dp0"

echo == E-Imar DEMO (sadece web, API gerekmez)
echo.
echo Tarayici: http://localhost:3001
echo Durdurmak icin Ctrl+C
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js yok. https://nodejs.org adresinden kurun.
  exit /b 1
)

if not exist node_modules call npm install
if not exist apps\e_imar_web\node_modules call npm install --prefix apps\e_imar_web

node scripts\dev-web-demo.mjs --open
