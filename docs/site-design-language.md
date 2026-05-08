# Website Design Language (Phase 1)

This document defines the visual/interaction language for the website implementation phase, based on:

- Parsel/TKGM-style map workflows
- e-Plan query patterns
- Kolayimar conversion-oriented flow
- Marketplace-style filter/list/map behavior (Sahibinden-inspired interaction pattern)

No UI code is implemented here; this is the design contract for frontend implementation.

## 1) Product feeling

- **Primary feel**: professional geo workspace, not a legacy public portal
- **Secondary feel**: conversion-oriented analysis platform
- **Interaction style**: map-first + fast side panel operations

## 2) Layout primitives

### Desktop
- Left rail: search and filters
- Main region: map canvas
- Right panel (contextual): selected parcel / analysis summary / report actions

### Mobile web
- Full map canvas
- Bottom sheet for parcel details
- Slide-in filter panel

## 3) Key UX patterns to implement

1. **List/Map duality**
   - toggle between map and list clusters
   - keep selected parcel synchronized in both states

2. **Progressive disclosure**
   - Step 1: quick parcel facts
   - Step 2: zoning & risk
   - Step 3: potential and report actions

3. **Layer controls**
   - searchable layer catalog
   - opacity controls for plan/parsel overlays
   - one-click reset (`Haritayı Temizle`)

4. **Fast query path**
   - İl -> İlçe -> Mahalle -> Ada/Parsel
   - coordinate query fallback
   - "Haritadan Seç" shortcut

## 4) Visual tokens (v1)

### Color roles
- `brand/primary`: deep blue or green for trust + geospatial context
- `surface/canvas`: neutral light gray in light mode, deep slate in dark mode
- `map/parcel-stroke`: high contrast red or blue
- `map/parcel-fill`: low alpha tint
- `state/warn`: amber
- `state/danger`: red
- `state/success`: green

### Typography
- Header: strong geometric sans
- Body: neutral sans
- Numeric data (emsal, TAKS, KAKS): tabular-friendly style

### Density
- map tools compact
- analysis cards medium density
- legal/provenance blocks low density with high readability

## 5) Component contracts (frontend-facing)

- `MapWorkspaceShell`
- `ParcelSearchPanel`
- `LayerCatalogDrawer`
- `ParcelDetailSheet`
- `PotentialSummaryCard`
- `PlanNoteExplainCard`
- `RiskBadgeGroup`
- `ReportActionsPanel`
- `DataProvenanceFooter`

Each component must map to backend response statuses:
- `ok`
- `empty`
- `not_ready`
- `requires_credentials`
- `unavailable`

## 6) API coupling rules

Primary orchestration:
- `POST /website/bff/parcel-workflow`
- `POST /website/bff/plan-note-explain`

Bootstrap:
- `GET /website/bootstrap`

Workspace:
- `GET /website/workspace/:userReference`

Do not duplicate geospatial calculations in frontend. Frontend is rendering + user input orchestration only.

## 7) Conversion hooks

- Sticky CTA in parcel detail:
  - `Analizi Gör`
  - `PDF Rapor`
  - `Favoriye Ekle`
- Surface confidence/source metadata near critical decisions.
- Track funnel events:
  - query_submitted
  - parcel_selected
  - analysis_opened
  - report_requested

## 8) Accessibility and quality baseline

- Keyboard-accessible controls for filter and layer panel
- Minimum AA contrast
- Skeleton states for map and panel loading
- Never show fake metric values; propagate backend readiness states directly
