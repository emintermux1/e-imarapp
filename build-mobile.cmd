@echo off
setlocal
cd /d "%~dp0"

echo == E-Imar mobile build (Android)

where flutter >nul 2>nul
if errorlevel 1 (
  echo ERROR: Flutter SDK not found.
  echo Install: https://docs.flutter.dev/get-started/install/windows
  exit /b 1
)

if "%E_IMAR_GATEWAY_BASE_URL%"=="" set E_IMAR_GATEWAY_BASE_URL=http://10.0.2.2:3000
if "%E_IMAR_ENV%"=="" set E_IMAR_ENV=dev
if "%BUILD_TYPE%"=="" set BUILD_TYPE=release

cd legacy\apps\e_imar_mobile

echo == flutter pub get
call flutter pub get
if errorlevel 1 exit /b 1

echo == flutter analyze
call flutter analyze
if errorlevel 1 exit /b 1

echo == flutter test
call flutter test
if errorlevel 1 exit /b 1

if /I "%BUILD_TYPE%"=="debug" (
  echo == flutter build apk --debug
  call flutter build apk --debug --dart-define=E_IMAR_GATEWAY_BASE_URL=%E_IMAR_GATEWAY_BASE_URL% --dart-define=E_IMAR_ENV=%E_IMAR_ENV%
) else (
  echo == flutter build apk --release
  call flutter build apk --release --dart-define=E_IMAR_GATEWAY_BASE_URL=%E_IMAR_GATEWAY_BASE_URL% --dart-define=E_IMAR_ENV=%E_IMAR_ENV%
  if errorlevel 1 exit /b 1
  echo == flutter build appbundle --release
  call flutter build appbundle --release --dart-define=E_IMAR_GATEWAY_BASE_URL=%E_IMAR_GATEWAY_BASE_URL% --dart-define=E_IMAR_ENV=%E_IMAR_ENV%
)

if errorlevel 1 exit /b 1

echo.
echo Build complete. Outputs in legacy\apps\e_imar_mobile\build\app\outputs\
