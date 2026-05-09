# E-İmar Mobil

Premium Flutter foundation for Turkey's E-İmar & Emsal Sorgu mobile product.

## What this app foundation covers

- Riverpod bootstrap and app config wiring
- Honest gateway integration for parcel and provider lookups
- GIS connector scaffold with isolate-friendly GeoJSON parsing and cache plumbing
- Premium mobile-first UI for search, map workspace, coverage/readiness, parcel detail, and watchlist tracking
- Clear provenance labels so official, public metadata, derived, demo, and unavailable states are never conflated

## Project structure

- `lib/main.dart` — app entrypoint with `ProviderScope`
- `lib/src/app/` — app shell, theme, and route wiring
- `lib/src/core/config/app_config.dart` — environment-based config provider
- `lib/src/core/services/gateway_api.dart` — Riverpod/Dio gateway client for live backend calls
- `lib/src/core/services/gis_connector.dart` — GIS repository + parsing path
- `lib/src/core/services/gis_layers.dart` — GIS layer/domain primitives
- `lib/src/features/map/domain/parcel.dart` — parcel, provider, provenance, and lookup domain models
- `lib/src/features/*` — mobile screens and product surfaces

## Run configuration

Set the gateway base URL with:

```bash
flutter run --dart-define=E_IMAR_GATEWAY_BASE_URL=https://your-gateway.example
```

Optional defines:

- `E_IMAR_ENV` — environment label shown by the app (`dev` by default)
- `E_IMAR_ENABLE_DEMO_FALLBACK` — reserved for future demo tooling; defaults to `false`

If `E_IMAR_GATEWAY_BASE_URL` is not set, the app remains usable but shows honest unavailable states instead of fabricated parcel data.

## Intended backend endpoints

The current mobile foundation expects the same gateway contract already used by `gateway_api.dart`:

- `GET /health`
- `GET /providers`
- `GET /regions`
- `GET /layers`
- `GET /parcel/by-admin?city&district&neighborhood&block&parcel`
- `GET /parcel/by-point?lat&lng`
- `GET /plan/by-parcel?lat&lng` or parcel identifiers
- `GET /city-map/metadata`
- `GET /e-plan/metadata`

The UI is intentionally conservative: if a provider is not configured or returns restricted/unsupported data, the app shows the limitation and next action instead of inventing parcel or zoning values.

## Data honesty and provenance rules

- Never label demo or metadata-only values as official TKGM or municipal parcel data.
- When the gateway or GIS layer is unavailable, the UI must say so explicitly.
- Public metadata, provider status, and source attribution are first-class UI elements.
- Empty states should explain what is missing and what the user can do next.

## Validation status

Flutter SDK is not installed in this environment, so `flutter pub get`, `flutter analyze`, and device/runtime validation could not be executed here.

The code is written to be idiomatic Flutter and ready for normal validation once Flutter is available locally or in CI.

