# Homepage Wireframe Contract (UI Implementation Spec)

This contract defines structure, content zones, and API bindings for the first website homepage implementation.

## 1. Purpose

- Drive users from landing context to map workspace quickly.
- Support both anonymous and signed-in entry points.
- Surface trust (official data sources, freshness, provenance).

## 2. Layout grid

## Desktop (>= 1280px)
- Header (sticky)
- Hero query section
- Value cards section
- How-it-works section
- Source trust section
- Footer

## Tablet (768-1279px)
- Same content blocks, stacked with reduced side paddings

## Mobile (< 768px)
- Compressed header
- Hero query first
- Key value cards carousel
- CTA pinned footer button to open map workspace

## 3. Block-by-block contract

### A) Header
- Left: brand/logo
- Center: nav links (`Ana Sayfa`, `Ada & Parsel`, `Hizmetler`, `Kurumsal`)
- Right:
  - guest: `Giriş`, `Kayıt Ol`
  - signed-in: `Workspace`, profile menu

Actions:
- `Kayıt Ol` -> `/register` (frontend route)
- `Workspace` -> `/workspace`

### B) Hero Query Card (primary conversion block)
- Inputs:
  - `city`
  - `district`
  - `neighborhood`
  - `adaNo`
  - `parcelNo`
- CTA: `İmar Durumu Sorgula`

API binding:
- On submit, frontend calls `POST /website/bff/parcel-workflow` with:
  - `query.type = "ada_parsel"`
  - `query.ada`, `query.parselNo`
  - optional `userReference`

Success behavior:
- route to `/map-workspace?mode=parcel-result`
- preload response payload into global state store

Error behavior:
- map backend states directly:
  - `not_ready`
  - `requires_credentials`
  - `unavailable`
  - `empty`

### C) Value Proposition Cards
Three fixed cards:
1. `Resmi Bilgiler`
2. `Detaylı Analiz`
3. `Yatırım Potansiyeli`

No live API required for initial render.

### D) How It Works (3-step)
1. Parsel bilgisi gir
2. Analizi görüntüle
3. Rapor al / kaydet

### E) Data Trust Strip
Render badges from bootstrap response:
- official source integration note
- freshness indicator
- provider readiness

API binding:
- `GET /website/bootstrap`

### F) Footer
- Legal links
- Data usage disclaimer
- Contact channels

## 4. State contract

Homepage state:
- `idle`
- `bootstrap_loading`
- `bootstrap_ready`
- `query_submitting`
- `query_success_redirecting`
- `query_error`

## 5. Analytics event contract

- `home_loaded`
- `home_bootstrap_loaded`
- `home_query_submitted`
- `home_query_success`
- `home_query_failed`
- `home_cta_register_clicked`

## 6. Accessibility requirements

- all form controls labeled
- keyboard focus ring visible
- error messages screen-reader friendly
- minimum AA contrast

## 7. Non-functional constraints

- hero query interaction budget: < 100 ms UI response
- first contentful paint target: < 2.5s on 4G mid-tier mobile
- no fake metrics or placeholder parcel outputs
