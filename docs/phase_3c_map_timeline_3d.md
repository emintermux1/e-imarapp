## Phase 3C: Map Intelligence — Timeline, Risk Layers, 3D Parcel Preview

### Summary

Three production-grade UI features built on top of the Phase 2B GIS/risk layer architecture:

1. **Historical Timeline Slider** — mock satellite imagery timeline 2019→2026
2. **Risk Layer Toggles** — 7-category overlay toggles integrated with Phase 2B `GisLayerDescriptor` presets
3. **3D Parcel Preview** — mock isometric massing card with floor count slider

All features are render-safe (`RepaintBoundary`), animation-safe (`Animated*` widgets), and do not create continuous repaint loops. No new dependencies.

### Files

| File | Purpose |
|------|---------|
| `domain/parcel.dart` | Added `HistoricalTimelineState`, `RiskLayerToggle` data models |
| `presentation/widgets/historical_timeline_slider.dart` | Custom timeline track with year dots + AI-textual change descriptions |
| `presentation/widgets/risk_layer_toggles.dart` | Toggle chips for 7 risk layers — toggles stored as `List<RiskLayerToggle>` |
| `presentation/widgets/mock_3d_parcel_preview.dart` | Expandable card with `_MassingPainter`, floor slider, legal limit warning |
| `presentation/widgets/map_controls_panel.dart` | Combined layer stack + timeline/risk toggle buttons for the map surface |
| `presentation/home_map_screen.dart` | Updated to host timeline/risk/3D panels and wire 3D quick action |
| `presentation/widgets/parcel_detail_sheet.dart` | Changed to StatefulWidget; added timeline/risk/3D action tiles inline |

### Architecture — Timeline

```
HistoricalTimelineSlider (StatefulWidget)
├── _TimelineTrack
│   ├── _TimelineProgressPainter (CustomPainter, deterministic, no AnimationController)
│   └── _TimelineDot × N (GestureDetector → setState → onYearChanged callback)
└── Text description (HistoricalTimelineState.description)
```

- Each year (2019–2026) produces a `HistoricalTimelineState` with a mock label and AI-style description.
- `shouldRepaint` is keyed to `progress` and `color` only — no continuous frames.
- Replacing with real Mapbox RasterSource: wire `onYearChanged` to swap a tileset layer by year slug, e.g. `mapbox://tileset-id/istanbul-satellite-2019`.

### Architecture — Risk Layer Toggles

```
RiskLayerToggles (StatefulWidget)
├── _LayerChip × N (AnimatedContainer, onTap → setState → onTogglesChanged)
└── Info footnote referencing Phase 2B GIS metadata
```

- `RiskLayerToggle.defaults` maps 1:1 to Phase 2B’s `officialRiskLayerPresets` (`RiskLayer` enum + `GisLayerDescriptor`).
- Replacing with real Mapbox sources: each active toggle adds a `FillLayer`/`LineLayer` with the corresponding `GisLayerDescriptor.endpoint` as a vector tile or GeoJSON source.
- The `opacity` field on `RiskLayerToggle` is reserved for per-layer transparency slider (future).

### Architecture — 3D Parcel Preview

```
Mock3dParcelPreview (StatefulWidget)
├── Collapsed header: "X kat olursa nasıl görünür?"
├── Expanded:
│   ├── _MassingCanvas → _MassingPainter (CustomPainter)
│   ├── _FloorSlider (Material Slider, 1–30)
│   └── _FloorInfo (conditional: legal vs. over-limit messaging)
```

- `_MassingPainter` draws an isometric rhombus-style ground plane, building prism, floor lines, and shadow.
- `shouldRepaint` keyed to `floors`, `taks`, `maxLegalFloors` — deterministic.
- Over-limit detection: when slider > `parcel.floorLimit`, building colors shift to danger red, a dashed legal-limit line appears, and warning text is shown.
- Replacing with real 3D: swap `_MassingCanvas` with a **Mapbox 3D Globe/Terrain + FillExtrusionLayer** using `height` property derived from floor count × standard floor height (3.0m).

### Real Mapbox/Tileset Replacement Path

| Feature | Mock Today | Real Tomorrow |
|---------|-----------|---------------|
| Timeline | `HistoricalTimelineState.fromYear(year)` | Mapbox RasterSource with annual tileset IDs; `Style.setStyleLayerProperty` per year |
| Risk toggles | `RiskLayerToggle.isActive` CSS chips | Mapbox `FillLayer`/`LineLayer` from `GisLayerDescriptor.endpoint` WMS/WFS → vector tile pipeline |
| 3D massing | `_MassingPainter` isometric 2D | Mapbox `FillExtrusionLayer` with `fill-extrusion-height` from `(floors * 3.0m)`, `fill-extrusion-base` = 0 |
| Layer controls | `MapControlsPanel` with toggle booleans | Mapbox `Style` layer visibility: `layer.setVisibility(Visibility.VISIBLE)` |

### Design Decisions

- **Fail-soft**: if Mapbox unavailable, `MockMapCanvas` remains the fallback; all Phase 3C overlays render on top regardless.
- **No AnimationControllers in painters**: `_TimelineProgressPainter` and `_MassingPainter` redraw only on `setState` from user interaction — no `Ticker` loops.
- **RepaintBoundary**: every new widget is wrapped in `RepaintBoundary` to isolate paint costs from the map surface.
- **No new deps**: timeline sliders use Material `SliderTheme`; 3D uses raw `CustomPainter`; toggles use existing `GlassCard`/`StatusBadge` primitives.
- **Turkish UX copy throughout**: "5 kat olursa nasıl görünür?", "İmar sınırı: X kat", "Zaman Tüneli", "Risk Katmanları".

### Verification

Since Flutter SDK is not available on this VM:
- All files passed brace balance checks (open/close `{}` match exactly).
- Git diff confirms only 3 existing files were modified (`parcel.dart`, `home_map_screen.dart`, `parcel_detail_sheet.dart`) — all within owned scope.
- No modifications to auth, favorites, valuation, PDF, emsal, design tokens, theme, or README/CHANGELOG.
- All 5 new widget files exist under `presentation/widgets/`.
- `git diff --check` reports no whitespace errors.
