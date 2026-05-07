# Phase 3C — Map Timeline, Risk Layers & Mock 3D Parcel Preview

> **Status**: Phase 3C delivered on branch `phase-3c-map-timeline-3d`  
> **Depends on**: Phase 2B (GIS layers merged into `main`)  
> **Target**: Mobile (Flutter / Mapbox)

## Overview

Phase 3C enriches the map-first experience with three interactive surface controls: a historical timeline slider, a rich risk-layer toggle panel, and a performant mock 3D massing preview. All views use mock data and mock rendering — no real GIS or 3D pipelines are called.

## Architecture

```
apps/e_imar_mobile/lib/src/features/map/
├── domain/
│   └── parcel.dart                        ← ParcelDetail: added yearApproved,constructionArea,unitCount
├── presentation/
│   ├── home_map_screen.dart               ← Integrates timeline / risk / 3D via ControlsRow
│   └── widgets/
│       ├── historical_timeline_slider.dart ← 2019→2026 timeline with AI-like TR change text
│       ├── risk_layer_toggles.dart         ← 7 toggle switches (deprem, fay, heyelan, sel, zemin, tarım, sit)
│       ├── mock_3d_parcel_preview.dart     ← Isometric mock building massing, kat slider 1-30
│       ├── map_controls_panel.dart         ← Composite container switching timeline/risk/3D modes
│       ├── parcel_detail_sheet.dart        ← Embeds 3D preview + timeline inside bottom sheet
│       └── mock_map_canvas.dart            ← Unchanged (existing mock raster painter)
```

## Component Details

### 1. Historical Timeline Slider (`historical_timeline_slider.dart`)

- **Data**: 8 hard-coded entries from 2019 through 2026, each with a Turkish title and AI-style explanatory paragraph.
- **Render**: Inline dot-track slider. Tapping a dot selects the year and shows the corresponding description card below.
- **State**: Ephemeral (`StatefulWidget`), no Riverpod provider.
- **CustomPainter**: Not used; pure widget composition with `AnimatedSize` for the body card.
- **Performance**: Deterministic — only rebuilds on tap; 2-3 repaints max per interaction.

### 2. Risk Layer Toggles (`risk_layer_toggles.dart`)

- **Data**: 7 toggles mapping to the `RiskLayer` enum from `gis_layers.dart`.
- **Defaults**: `deprem`, `fayHatti`, `zeminTipi` are on; others off.
- **Render**: GlassCard rows with Material `Switch` widgets.
- **Callback**: `ValueChanged<Map<String, bool>>` on every toggle change.

### 3. Mock 3D Parcel Preview (`mock_3d_parcel_preview.dart`)

- **Render**: Custom isometric massing painted by `_MockMassingPainter`.
- **Interaction**: +/− buttons and a Material `Slider` for floor count (1–30).
- **Performance**: Wrapped in `RepaintBoundary`; only repaints when `floorCount` changes.
- **Visual**: Stacked floor slabs with top-face highlight; site boundary outline; road/neighbor labels.

### 4. Map Controls Panel (`map_controls_panel.dart`)

- A composite widget that hosts `MapControlMode.timeline`, `.riskLayers`, or `.threeD` and uses `AnimatedSwitcher` for transitions.

### 5. Home Map Screen Integration

- **ControlsRow** replaces the old standalone timeline/risk/3D placements.
- **CommandBar** now has a shield icon that toggles to risk mode.
- **LayerStack** 3D button now triggers the threeD control mode.
- **QuickAction** 3D button also triggers the threeD control mode.

### 6. Parcel Detail Sheet

- Embeds `Mock3dParcelPreview` and `HistoricalTimelineSlider` directly in the scrollable bottom sheet.
- Shows plan year as a badge.

## How to Replace Mocks with Real Integrations

| Component | Mock Today | Production Target |
|---|---|---|
| Timeline entries | Hard-coded `_TimelineEntry` list | CMS or municipality open-data API; parse plan-revision records |
| Timeline descriptions | Static Turkish text | Generate with Gemini / GPT via `ai_services.dart`; cache in Firestore |
| Risk layer toggles | Local `_toggleEntries` map | Bind to `GisLayerRepository.availableLayers()` and call `fetchFeatures()` per visible layer |
| Mock 3D massing | `_MockMassingPainter` isometric | Mapbox 3D terrain + fill-extrusion layers; swap to Three.js / Cesium if needed |
| 3D floor slider | Hypothetical parcel area | Compute actual TAKS footprint from parcel geometry; multiply by `floorCount` |
| Map layer switcher | Uydu/Arazi/3D buttons | Wire to Mapbox style URL switches (`mapbox://styles/...`) |

## Acceptance Criteria

- [x] Timeline slider renders 8 year-dots (2019–2026) with animated body cards.
- [x] Risk toggles show 7 switches; 3 default-on; callback fires on change.
- [x] 3D preview paints a building massing; floor slider works 1–30.
- [x] HomeMapScreen integrates controls row; command bar links to risk mode.
- [x] ParcelDetailSheet embeds 3D + timeline sections.
- [x] No continuous repaint loops; all CustomPainters have `shouldRepaint` guards.
- [x] No new dependencies.
- [x] Git diff passes `--check`.

## Related Branches / PRs

- `phase-2b-gis-risk-analysis` — parent, now merged into `main`
- `phase-3c-map-timeline-3d` — this deliverable
