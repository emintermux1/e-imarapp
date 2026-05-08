# Site Design Phase 1 (UI-free Product Design Blueprint)

This document turns the collected references/screenshots into a concrete website product design plan without implementing frontend UI code yet.

## 1) What we extracted from references

### Strong patterns to keep

- **Map-first experience**: parcel boundaries, overlays, and quick parcel context must be primary.
- **Layer catalog model**: searchable thematic layers (land use, risk, infrastructure, planning).
- **Single-flow parcel analysis**: parcel selection -> zoning data -> potential analysis -> report/share.
- **Simple left panel navigation**: parcel search, plan search, address search, clear map, current location.
- **Opacity/visibility controls** for plan and parcel overlays.

### Noise to ignore

- Telegram channel content from `t.me/trenchfrof/33` is mostly unrelated to production e-imar backend design and should not drive product decisions.

## 2) Website v1 Information Architecture

1. **Home / Landing**
   - value proposition
   - city/parcel quick query
   - trust indicators (source integrations, freshness)

2. **Map Workspace** (core screen)
   - map canvas
   - layer catalog/search
   - parcel search inputs
   - selected parcel sheet

3. **Parcel Analysis**
   - zoning facts
   - potential summary ("Bu arsaya ne yapılabilir?")
   - emsal/share calculator result
   - risk summary

4. **Plan Notes & Explain**
   - raw note
   - AI plain-language explanation
   - confidence + source provenance

5. **Workspace (User)**
   - saved parcels/favorites
   - recent queries
   - watchlist subscriptions

6. **Reports**
   - report request status
   - share/download links

## 3) Page-level API mapping (already available)

- `GET /website/bootstrap`
- `POST /website/bff/parcel-workflow`
- `POST /website/bff/plan-note-explain`
- `GET /website/workspace/:userReference`
- `POST /website/session/start`
- `POST /website/session/verify`

Domain APIs still directly usable for advanced clients:
- `/parcels/query`
- `/analysis/parcel-potential`
- `/simulation/emsal-share/calculate`
- `/eplan/subscriptions`

## 4) UX flow contracts (no UI code yet)

### Flow A: Parcel from map/search -> decision output
1. User submits parcel query (ada/parsel or coordinate).
2. Website calls `/website/bff/parcel-workflow`.
3. Response drives:
   - parcel cards
   - selected parcel sheet
   - potential summary
   - optional emsal/share panel

### Flow B: Plan note explanation
1. User opens plan note.
2. Website calls `/website/bff/plan-note-explain`.
3. Render:
   - plain summary
   - bullet highlights
   - risks/uncertainties

### Flow C: Personal workspace
1. User opens dashboard.
2. Website calls `/website/workspace/:userReference`.
3. Render:
   - favorites
   - history
   - subscription status

## 5) Design system tokens (for upcoming UI phase)

Use backend-safe naming now so frontend can adopt immediately:

- `surface/base`, `surface/elevated`, `surface/overlay`
- `text/primary`, `text/secondary`, `text/muted`
- `intent/success`, `intent/warn`, `intent/danger`, `intent/info`
- `map/parcel-fill`, `map/parcel-stroke`, `map/plan-fill`, `map/risk-overlay`

## 6) MVP scope lock (Phase 1 website)

Must-have:
- map workspace shell
- parcel workflow integration
- plan note explain integration
- workspace integration
- report request read model

Not in phase 1:
- full 3D visual editor
- advanced portfolio optimizer
- satellite timeline playback UI

## 7) Data and legal safeguards

- Never display fake parcel/zoning values.
- When data unavailable, render backend state (`not_ready`, `requires_credentials`, `unavailable`) as explicit UX state.
- For transaction/deed trend features, show only after legal/licensed data integration is completed.

## 8) Immediate next step (Phase 2)

Create UI implementation tickets based on this blueprint:

1. `web-ui-001`: Map Workspace skeleton + layer catalog panel
2. `web-ui-002`: Parcel Result Sheet + Potential Summary card
3. `web-ui-003`: Plan Note Explain page
4. `web-ui-004`: Workspace dashboard (history/favorites/subscriptions)
5. `web-ui-005`: Error/readiness states mapped to backend taxonomy
