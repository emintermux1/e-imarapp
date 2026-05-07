# E-İmar

`E-İmar` (`İmar ve Emsal Sorgu`) is a Flutter 3.24+ mobile app foundation for premium Turkish parcel, zoning, emsal, risk, valuation, and reporting workflows.

## Repository layout

```text
apps/e_imar_mobile/        Flutter mobile application
packages/e_imar_core/      Shared core contracts and value objects
firebase/                 Secure-by-default Firebase rules and setup notes
```

The app uses a clean architecture / MVVM-ish structure. Feature folders split `domain`, `data`, and `presentation` where relevant. Cross-cutting concerns live under `lib/src/core`.

## Configuration

Real Firebase, Mapbox, and AI secrets are not required for local development. Copy `.env.example` to `.env` only when integrating live services. If `MAPBOX_ACCESS_TOKEN` is absent the map screen renders a premium mocked satellite/parcel canvas. Firebase initialization is guarded and fails soft when placeholder options are used.

FlutterFire production setup should generate platform-specific `firebase_options.dart` and native config files. The checked-in stub is intentionally safe for local runs.

## Development

```bash
cd apps/e_imar_mobile
flutter pub get
flutter run --dart-define=MAPBOX_ACCESS_TOKEN=...
```

Useful compile checks:

```bash
flutter analyze
flutter test
```

This environment may not include Flutter; the source is structured to be compile-ready with Flutter 3.24+ once the SDK is installed.

## Architecture

- `app/`: `MaterialApp.router`, GoRouter routes, global shell decisions.
- `core/config`: environment and optional-service gates.
- `core/theme`: premium light/dark/AMOLED themes, tokens, glass, motion.
- `core/performance`: debouncer/throttler, animation helpers, diagnostics gates, cache hints.
- `features/auth`: Firebase-backed contracts with mock/fail-soft implementations for Google, Apple, and Phone OTP.
- `features/map`: map-first home, parcel detail sheet, GIS layer abstractions.
- `features/search`: ada/parsel and coordinate search UX with mocked selectors.
- `features/emsal`: pure domain calculator and premium summary UI.
- `core/services`: Firebase repository contracts, GIS/AI/PDF service abstractions.

## Data source roadmap

Phase 1 only defines integration seams. Future phases can add authorized and ethical ingestion for:

- e-Plan.gov.tr plan notes and zoning documents
- TKGM parcel/cadastre lookups where legally accessible
- Municipality open-data WMS/WFS/GeoJSON feeds
- AFAD hazard/risk datasets
- Sahibinden, Emlakjet, Hepsiemlak through partner APIs or permitted datasets only

## Branch strategy

`main` remains stable. Feature branches should be scoped by phase or capability, e.g. `phase-2-live-gis`, `phase-3-reporting`, `phase-4-market-intel`. Captain creates PRs from task branches after implementation.

## Phase roadmap

1. Foundation: app shell, premium design system, mock map/search/emsal/auth, service abstractions.
2. Live GIS: Mapbox styles, municipality/TKGM/e-Plan connectors, offline cache, layer styling.
3. Accounts: Firebase Auth, profiles, favorites, saved searches, notifications.
4. Reports: PDF export, share flows, branded parcel valuation reports.
5. Intelligence: AI-assisted parcel analysis, ethical market-data valuation, yearly heatmaps.
6. Study requests: paid workflows, consultant handoff, admin moderation.
