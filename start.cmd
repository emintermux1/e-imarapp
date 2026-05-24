@echo off
setlocal
cd /d "%~dp0"

echo == E-Imar local launcher (Windows)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Install from https://nodejs.org
  exit /b 1
)

if not exist node_modules (
  echo Installing root dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

if not exist apps\e_imar_web\node_modules (
  echo Installing web dependencies...
  call npm install --prefix apps\e_imar_web
  if errorlevel 1 exit /b 1
)

if not exist .env (
  copy /Y .env.example .env >nul
  echo Created .env from .env.example
)

if not exist apps\e_imar_web\.env (
  copy /Y apps\e_imar_web\.env.example apps\e_imar_web\.env >nul
  echo Created apps\e_imar_web\.env
)

echo.
echo Starting API (:3000) and Web (:3001)...
echo Open http://localhost:3001 in your browser.
echo.

node scripts\dev-all.mjs
