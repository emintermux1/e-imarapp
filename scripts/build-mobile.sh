#!/usr/bin/env bash
# Build E-İmar Flutter mobile app (Android APK + optional AAB).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$ROOT_DIR/legacy/apps/e_imar_mobile"
BUILD_TYPE="${BUILD_TYPE:-release}"
OUTPUT_AAB="${OUTPUT_AAB:-1}"
GATEWAY_URL="${E_IMAR_GATEWAY_BASE_URL:-http://10.0.2.2:3000}"
APP_ENV="${E_IMAR_ENV:-dev}"

if ! command -v flutter >/dev/null 2>&1; then
  echo "ERROR: Flutter SDK not found. Install from https://docs.flutter.dev/get-started/install" >&2
  exit 1
fi

cd "$MOBILE_DIR"

echo "==> Flutter pub get"
flutter pub get

echo "==> Flutter analyze"
flutter analyze

echo "==> Flutter test"
flutter test

DART_DEFINES=(
  "--dart-define=E_IMAR_GATEWAY_BASE_URL=$GATEWAY_URL"
  "--dart-define=E_IMAR_ENV=$APP_ENV"
)

if [[ "$BUILD_TYPE" == "debug" ]]; then
  echo "==> Building debug APK"
  flutter build apk --debug "${DART_DEFINES[@]}"
  echo ""
  echo "APK: $MOBILE_DIR/build/app/outputs/flutter-apk/app-debug.apk"
else
  echo "==> Building release APK"
  flutter build apk --release "${DART_DEFINES[@]}"
  echo "APK: $MOBILE_DIR/build/app/outputs/flutter-apk/app-release.apk"
  if [[ "$OUTPUT_AAB" == "1" ]]; then
    echo "==> Building release App Bundle (Play Store)"
    flutter build appbundle --release "${DART_DEFINES[@]}"
    echo "AAB: $MOBILE_DIR/build/app/outputs/bundle/release/app-release.aab"
  fi
fi

echo ""
echo "Mobile build complete."
