# Changelog

## 0.1.1 - Phase 1.1 Design Polish

- Expanded semantic design tokens for premium emerald/black/sand surfaces, glass overlays, map/risk colors, status colors, gradients, and elevation tiers.
- Upgraded reusable UI primitives with richer glass cards, premium headers, status/risk badges, insight cards, score cards, and metric tiles.
- Redesigned the map-first home experience with a floating command bar, live status badges, stacked layer controls, cinematic mock map, selected parcel preview, and premium quick actions.
- Reworked parcel detail, search, emsal calculator, onboarding, and auth screens toward a modern Apple Maps / fintech / real-estate feel while keeping integrations mock/fail-soft.
- Preserved performance constraints with deterministic non-repainting map painting, RepaintBoundary usage, const-friendly widgets, and no new design dependencies.

## 0.1.0 - Phase 1 Foundation

- Added monorepo-style Flutter workspace under `apps/e_imar_mobile` and shared package boundary under `packages/e_imar_core`.
- Added guarded app bootstrap, router, theme system, performance helpers, and placeholder Firebase options.
- Added premium Turkish UI scaffolding for onboarding, auth, home map, parcel detail sheet, search, settings, favorites, analysis, and emsal calculator.
- Added clean integration seams for Firebase, Mapbox, GIS layers, AI analysis, and PDF reporting without requiring real secrets.
- Added secure-by-default Firebase rules and setup documentation.
