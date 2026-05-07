# Phase 2E CI quality gates

Phase 2E adds a GitHub Actions quality gate for the Flutter mobile app. The workflow lives at `.github/workflows/flutter_mobile_ci.yml` and runs on pull requests that touch the mobile app, shared Dart packages, or the workflow itself. It also runs on pushes to `main` for the same paths.

## Required toolchain

Use Flutter `3.24.x` or newer on the stable channel. The mobile app declares a Dart SDK constraint of `>=3.5.0 <4.0.0`, which is satisfied by Flutter 3.24 stable.

Check your local version:

```sh
flutter --version
```

## Local validation commands

Run these commands before opening or updating a pull request:

```sh
cd apps/e_imar_mobile
flutter pub get
flutter analyze
flutter test
dart format --set-exit-if-changed . ../../packages/e_imar_core
```

The format check is intentionally scoped to the Flutter app and shared Dart package code used by the app. It avoids unrelated repository files and keeps CI aligned with the workflow path filters.

## CI behavior

The workflow performs these steps:

1. Checks out the repository.
2. Installs Flutter stable `3.24.x` with `subosito/flutter-action`.
3. Uses the Flutter action cache for SDK and pub package reuse where supported.
4. Runs `flutter pub get` in `apps/e_imar_mobile`.
5. Runs `flutter analyze`.
6. Runs `flutter test`.
7. Runs `dart format --set-exit-if-changed` for the app and shared Dart package.

## Secrets and credentials

No secrets or deployment credentials are required for this phase. The workflow is limited to placeholder-safe analysis, tests, dependency resolution, and formatting. Firebase credentials, signing keys, store API keys, and deployment tokens must not be added to this workflow.

## Future deployment lanes

Future phases can add separate workflows or jobs for:

- Android release builds and Play Console upload.
- iOS archive/export and App Store Connect upload.
- Firebase App Distribution lanes for internal testing.
- Environment-specific integration tests that use explicitly provisioned CI secrets.
- Signed build artifact retention with short retention windows.

Those lanes should remain separate from this quality gate unless they are optional or protected by environment approvals.
