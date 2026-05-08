# e_imar_mobile

Flutter app for the E-İmar mobile product surface (map-first parcel preview, analysis, report preview, emsal workflows).

This document is intended for engineers working on the app code in `apps/e_imar_mobile`.

## Intent and boundaries

- **Intent**: provide a premium UX shell for parcel/zoning workflows while integrations mature.
- **Current data mode**: mostly mock/fail-soft for map, GIS, AI, and report flows.
- **Non-goal (today)**: this app does not claim authoritative municipality/TKGM results without live backend integrations.

## Quick start

### Prerequisites

- Flutter SDK compatible with Dart `>=3.5.0 <4.0.0`
- Platform toolchains for your target (Android/iOS/Web)

### Install and run

```bash
cd apps/e_imar_mobile
flutter pub get
flutter run
```

Optional defines (for live-service wiring):

```bash
flutter run \
  --dart-define=APP_ENV=development \
  --dart-define=MAPBOX_ACCESS_TOKEN=... \
  --dart-define=OPENAI_API_KEY=... \
  --dart-define=GROK_API_KEY=... \
  --dart-define=FIREBASE_PROJECT_ID=...
```

## Environment flags and behavior

`lib/src/core/config/app_config.dart` reads all runtime flags via `String.fromEnvironment`.

| Define | Default | Used for | Behavior when missing |
|---|---|---|---|
| `APP_ENV` | `development` | Env-sensitive app switches | App still runs in dev mode |
| `MAPBOX_ACCESS_TOKEN` | empty | Mapbox availability checks | App falls back to mock map experiences |
| `OPENAI_API_KEY` | empty | AI service selection seam | Mock AI services remain active |
| `GROK_API_KEY` | empty | AI price service seam | Mock AI services remain active |
| `FIREBASE_PROJECT_ID` | `e-imar-placeholder` | Firebase enable gate | Firebase init is skipped |

## App startup workflow

Source: `lib/main.dart`

1. Build `AppConfig` from compile-time defines.
2. Initialize Firebase **only if** `firebaseEnabled`.
3. Initialize offline parcel store and seed initial sample parcel records.
4. Prune stale cached parcels older than 90 days.
5. Attach Crashlytics handlers only when Firebase is enabled and not debug.
6. Start `EImarApp` with Riverpod override for `appConfigProvider`.

Operational note: Firebase init failures are caught and logged, and startup continues.

## Architecture overview

Top-level code layout:

```text
lib/
├── main.dart
├── src/app/                 App shell + router
├── src/core/                Config, theme, shared services, widgets, perf helpers
├── src/features/            Feature modules (map, search, analysis, reports, ...)
├── src/data/                Local/offline data models and repositories
└── firebase_options.dart    FlutterFire options stub
```

Primary architecture style: feature-oriented layers with domain/data/presentation splits where needed, plus shared cross-cutting core modules.

## Public app interfaces

### Routing interface (`lib/src/app/router/app_router.dart`)

The router currently exposes these named route surfaces:

- `/` (`splash`)
- `/onboarding`
- `/auth`
- `/home`
- `/search`
- `/parcel-detail`
- `/emsal`
- `/ai-valuation`
- `/analysis`
- `/parcel-report`
- `/favorites`
- `/study-request`
- `/notifications`
- `/settings`

`initialLocation` is currently `/auth`.

### Core service interfaces

- `ParcelAiAnalysisService` / `MarketValuationService` / `ParcelAiService`
  - File: `lib/src/core/services/ai_services.dart`
  - Current implementation: `MockParcelAiService` (with placeholder provider-specific subclasses)
- `ParcelReportService`
  - File: `lib/src/core/services/pdf_report_service.dart`
  - Current implementation: `PremiumParcelReportService`
- `GisLayerRepository`
  - File: `lib/src/core/services/gis_layers.dart`
  - Current implementation: `MockGisLayerRepository`
- `OfflineParcelRepository`
  - File: `lib/src/data/repositories/offline_parcel_repository.dart`
  - Current implementation: in-memory store (`InMemoryParcelStore`) with seeded records

## Developer workflows

### 1) Map-first parcel exploration

- Entry: `/home` (`HomeMapScreen`)
- User can open parcel detail bottom sheet, route to analysis/report/emsal/search.
- Risk/timeline/3D controls are mock UX surfaces backed by feature widgets under:
  - `src/features/map/presentation/widgets/`

### 2) Offline parcel cache workflow

`OfflineParcelRepository` supports:

- Save and update parcel detail records (`saveParcel`)
- Fetch by block/parcel (`getParcel`)
- District/favorite/followed queries (`getByDistrict`, `getFavorites`, `getFollowed`)
- Recency query (`getRecent`)
- Search across district/neighborhood/block/parcel (`search`)
- Retention cleanup (`pruneStaleParcels`)

Constraint: despite names referencing Isar, current implementation is process-memory only.

### 3) Report preview workflow

`PremiumParcelReportService` builds a multi-page PDF with:

- Parcel identity and zoning metrics
- Risk summary and AI insight sections
- Valuation assumptions
- Mock-data watermarking when `usesMockData == true`
- Legal disclaimer (`defaultLegalDisclaimer`)

## Testing and quality checks

```bash
cd apps/e_imar_mobile
flutter analyze
flutter test
```

Web preview build (for UI review):

```bash
flutter build web --release
python3 -m http.server 8081 --bind 0.0.0.0 --directory build/web
```

See also: `../../docs/preview_web.md`.

## Troubleshooting runbook

### App starts but Firebase features are inactive

Check `FIREBASE_PROJECT_ID`. If it is omitted (or set to `e-imar-placeholder`), Firebase initialization is intentionally skipped.

### Crashlytics never receives errors in local runs

Expected in debug mode. Crashlytics reporting is gated by both Firebase enablement and `!kDebugMode`.

### Map is visible but not using live parcel/GIS data

Expected unless production connectors are wired. Current map/GIS stack intentionally uses mock repositories and descriptors with placeholder endpoints.

### Offline cache does not persist between app restarts

Expected with current in-memory store implementation. Persistence-layer migration is required to make cache durable.

### AI valuation output looks deterministic or repeated

Expected with `MockParcelAiService`, which returns deterministic mock narratives and mock citation/source notes.

## Common pitfalls

- Treating mock outputs as official municipal/tapu outcomes.
- Assuming Isar persistence is active because of naming (`initializeIsar`, `IsarParcel`) when runtime storage is currently in-memory.
- Assuming API keys in `--dart-define` are loaded from `.env` automatically (they are compile-time defines, not runtime dotenv values).

## Related docs

- `README.md` (repo-level architecture and roadmap)
- `../../docs/phase_2b_gis.md`
- `../../docs/phase_2c_reports.md`
- `../../docs/phase_3c_map_timeline_3d.md`
- `../../docs/preview_web.md`
