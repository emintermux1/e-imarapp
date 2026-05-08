# Site UI Implementation Backlog (derived from backend + design docs)

This backlog is implementation-ready and aligned to existing backend endpoints.

## Epic A — Map Workspace

### A1. Workspace shell
- Build 3-region desktop shell (left panel / map / right context)
- Mobile: map + bottom sheet
- Depends on: `GET /website/bootstrap`

### A2. Parcel search panel
- Inputs: il, ilçe, mahalle, ada, parsel
- Submit to `POST /website/bff/parcel-workflow`
- Show status chips for response state taxonomy

### A3. Layer catalog
- Searchable layer list
- Toggle + opacity sliders
- Reset map state action

## Epic B — Parcel & Analysis Experience

### B1. Parcel detail sheet
- Geometry selection + parcel facts
- Quick stats from workflow response

### B2. Potential summary card
- Show:
  - max building type
  - estimated floors
  - estimated units
  - parking need
  - risk score

### B3. Emsal/share calculator panel
- Feed optional `emsalInput` into parcel workflow
- Display owner/contractor split

## Epic C — Plan Notes & Explain

### C1. Explain page
- Submit to `POST /website/bff/plan-note-explain`
- Render:
  - summary
  - bullets
  - risks
  - uncertainties

### C2. Provider/readiness fallback
- If `requires_credentials`, show secure integration state card

## Epic D — User Workspace

### D1. Unified workspace page
- Fetch `GET /website/workspace/:userReference`
- Tabs:
  - history
  - favorites
  - subscriptions

### D2. Notification subscription controls
- Integrate `POST /eplan/subscriptions`
- webhook/push channel forms

## Epic E — Trust, provenance, legal

### E1. Source confidence footer
- Per result, show data source and freshness

### E2. Legal readiness states
- Distinguish:
  - available
  - requires credentials/legal agreement
  - unavailable

---

## Sequencing (recommended)

1. A1 -> A2 -> B1
2. B2 -> B3
3. C1 -> C2
4. D1 -> D2
5. E1 -> E2
