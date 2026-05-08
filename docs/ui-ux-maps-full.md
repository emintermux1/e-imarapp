# Full UI/UX Maps (Website v1)

This document provides complete UX mapping for implementation kickoff.

## 1) Screen map

```text
S0  Landing / Homepage
  ├─ S1 Map Workspace
  │   ├─ S1.1 Parcel Search Panel
  │   ├─ S1.2 Layer Catalog Drawer
  │   ├─ S1.3 Parcel Detail Sheet
  │   └─ S1.4 Analysis Side Panel
  ├─ S2 Plan Note Explain
  ├─ S3 Workspace Dashboard
  │   ├─ S3.1 Query History
  │   ├─ S3.2 Favorites
  │   └─ S3.3 Notification Subscriptions
  └─ S4 Report Center
```

## 2) Primary user flows

### Flow A — Fast parcel decision
1. User lands on S0
2. Submits parcel query
3. Redirect to S1 with preloaded result
4. Opens S1.3 parcel sheet
5. Opens S1.4 analysis
6. Saves favorite or requests report

### Flow B — Plan understanding
1. User reaches S1.4 analysis
2. Opens plan note explain route S2
3. Reads plain-language summary + risk/uncertainty
4. Returns to S1.4 for decision

### Flow C — Ongoing tracking
1. User opens S3 dashboard
2. Reviews history/favorites
3. Adds or updates notification subscriptions

## 3) Navigation map

Global nav:
- `Ana Sayfa` -> S0
- `Ada & Parsel` -> S1
- `Analiz` -> S1.4
- `Workspace` -> S3
- `Raporlar` -> S4

Contextual nav:
- S1.3 -> `Analizi Gör` => S1.4
- S1.4 -> `Plan Notunu Açıkla` => S2
- S1.4 -> `PDF Rapor` => S4

## 4) State overlays map

Applicable across all screens:
- LOADING overlay
- EMPTY state panel
- ERROR state panel
- NOT_READY state panel
- REQUIRES_CREDENTIALS state panel

These map directly to backend taxonomy and must never be hidden.

## 5) Device adaptation map

### Desktop
- parallel panels
- persistent left filter rail

### Tablet
- collapsible layer drawer
- two-panel mode for landscape

### Mobile
- fullscreen map
- swipeable bottom sheet
- compact floating controls

## 6) Interaction map (critical controls)

- map click -> select parcel
- parcel select -> sheet open
- sheet scroll threshold -> sticky action bar
- layer toggle -> immediate map repaint
- opacity slider -> instant style update
- clear map -> reset selection + overlays + panel state

## 7) Data dependency map

S0:
- `GET /website/bootstrap`

S1:
- `POST /website/bff/parcel-workflow`
- `GET /website/bootstrap` (layer/provider readiness)

S2:
- `POST /website/bff/plan-note-explain`

S3:
- `GET /website/workspace/:userReference`
- `POST /eplan/subscriptions`

S4:
- (existing report endpoints)

## 8) Frontend acceptance checklist

- [ ] All primary flows completed without dead ends
- [ ] All backend readiness states visibly represented
- [ ] No fake/derived legal-zoning values shown
- [ ] Keyboard and mobile gesture support verified
- [ ] Loading/error behavior deterministic across screens
