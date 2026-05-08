# E-İmar Web — Türkiye Parsel · Plan · GIS

Production-grade Türkçe e-imar / parsel / cadastral GIS frontend, built with
Next.js 14 App Router. The visual language is intentionally *dense and
restrained* — TKGM Parsel Sorgu, sahibinden, ArcGIS Online and Bloomberg
Terminal are the references; we deliberately avoid the marketing-landing,
neon, glassmorphism, toy-rounded vocabulary.

> This package replaces the previous Vite shell. The Flutter mobile app at
> `apps/e_imar_mobile/` is **not** modified by this work.

---

## Run

```bash
# from repo root
npm install --prefix apps/e_imar_web
npm --prefix apps/e_imar_web run dev   # http://localhost:3000

# typecheck / build
npm --prefix apps/e_imar_web run typecheck
npm --prefix apps/e_imar_web run build
npm --prefix apps/e_imar_web run start
```

The repo-root scripts also wrap these:

```bash
npm run web:dev
npm run web:typecheck
npm run web:build
```

### Environment

Out of the box, the app uses fully token-free providers:

- Carto Voyager raster tiles (light)
- Carto Dark Matter raster tiles (dark)
- Esri World Imagery raster tiles (uydu)
- OpenTopoMap raster tiles (topografik)

Optional Mapbox switching is **gated** behind:

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxx
```

If the variable is set, a future Task 2 enhancement can swap in Mapbox styles.
This task does not install the Mapbox SDK.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14** App Router (TypeScript strict) |
| Styling | **Tailwind CSS v3** + `clsx`/`tailwind-merge`/`cva` |
| State | **Zustand** with `persist` (UI, Map, Watchlist, History) |
| Async | **@tanstack/react-query** (mock fetcher boundary, ready for backend swap-in) |
| Map | **MapLibre GL JS** (no token); style swapper for Voyager/Dark/Satellite/Topographic |
| Theme | **next-themes** (`class` strategy) |
| Motion | **framer-motion** (panel/sheet only) |
| Primitives | **@radix-ui/react-***: accordion, dialog, dropdown-menu, popover, scroll-area, slider, switch, tabs, tooltip, separator, label |
| Icons | **lucide-react** |

We deliberately avoid pulling in heavy dribbble UI libraries; primitives are
hand-built where Radix isn't necessary.

---

## File Tree (highlights)

```
apps/e_imar_web/
  src/
    app/
      layout.tsx, page.tsx, globals.css, providers.tsx
      sorgu/[adaParsel]/page.tsx           # deep link
      sorgu/[adaParsel]/not-found.tsx
      sorgu/[adaParsel]/parcel-deep-link-bootstrap.tsx
      emsal/page.tsx                       # standalone calculator
    components/
      ui/                                  # button, accordion, dialog, popover…
      layout/
        app-shell.tsx, top-bar.tsx, left-sidebar.tsx,
        right-info-panel.tsx, mobile-bottom-sheet.tsx,
        brand-mark.tsx, header-breadcrumb.tsx, theme-toggle.tsx
      map/
        map-canvas.tsx                     # MapLibre wrapper
        map-hud.tsx                        # zoom, compass, scale, coords, mode
        layer-toggle-list.tsx
        basemap-switcher.tsx
      gis/
        data-card.tsx, parcel-card.tsx, zoning-badge.tsx,
        layer-toggle.tsx, gis-legend.tsx, risk-indicator.tsx,
        timeline-panel.tsx, plan-change-card.tsx,
        satellite-compare-slider.tsx, three-d-preview-panel.tsx
      search/global-search.tsx
      sidebar/
        sidebar-sections.tsx, watchlist-section.tsx,
        saved-queries-section.tsx, history-section.tsx,
        filters-section.tsx
      info/
        section-konum.tsx, section-imar.tsx, section-plan-notlari.tsx,
        section-riskler.tsx, section-aski.tsx, section-cevre.tsx,
        section-gecmis.tsx, section-yatirim-skoru.tsx
      emsal/
        emsal-calculator-panel.tsx, emsal-dialog-content.tsx,
        emsal-result-card.tsx
    lib/
      utils.ts, format.ts                  # Türkçe / tabular formatlayıcılar
      math/emsal.ts                        # Emsal hesabı (Dart paritesi)
      maplibre/styles.ts, maplibre/layers.ts
    data/
      provinces.ts, districts.ts, neighborhoods.ts,
      parcels.geo.json (~30 polygon),
      zoning.ts, plan-notes.ts, aski-list.ts,
      risk-scores.ts, environment.ts, investment-scores.ts,
      belediye.ts, parcels.ts (accessor)
    stores/
      ui-store.ts, map-store.ts,
      watchlist-store.ts (persisted), history-store.ts (persisted)
    hooks/
      use-parcel.ts, use-search.ts, use-mounted.ts, use-media-query.ts
    types/
      parcel.ts, zoning.ts, geo.ts
    styles/
      tokens.css                           # tek kaynak — light + dark CSS vars
```

---

## Design system

### Color tokens

`src/styles/tokens.css` is the single source of truth. Every value is a
**space-separated RGB triplet** so it composes with Tailwind's
`<alpha-value>` syntax (`rgb(var(--bg) / 0.5)`).

Light theme key tokens:

```
--bg              255 255 255       /* #FFFFFF */
--surface-1       247 248 250       /* #F7F8FA */
--surface-2       255 255 255       /* card surface */
--border-subtle   229 231 235
--border-strong   209 213 219
--text-primary    15 23 42
--text-secondary  71 85 105
--text-muted      107 114 128
--accent-red      200 16 46         /* #C8102E devlet kırmızısı */
--accent-navy     16 42 76          /* #102A4C koyu lacivert */
--accent-blue     59 110 165        /* #3B6EA5 link/focus ring */
--status-success  21 128 61
--status-warning  180 83 9
--status-error    185 28 28
```

Dark theme key tokens (`.dark` on `<html>`):

```
--bg              11 15 20          /* #0B0F14 — never pitch black */
--surface-1       17 22 29
--surface-2       22 28 37
--border-subtle   30 37 48
--border-strong   42 51 64
--text-primary    230 234 241
```

Zoning fill / stroke pairs (used identically in legend, badge, parcel layer):

```
Konut    #FFE9A8 / #C39A2B
Ticaret  #FFCFC0 / #B14D2B
Karma    #E2D2F2 / #6E48A8
Sanayi   #C9D6E0 / #44607A
Yesil    #C6E5C2 / #3D7A33
Tarim    #E5DDB3 / #87772F
Kamu     #BFD8F2 / #2F5C8E
Turizm   #FFD9B3 / #B5651D
```

Risk severity ramp `--risk-0..--risk-5` (success → strong red).

### Typography

`Inter` via `next/font/google` (latin + latin-ext) at weights 400 / 500 / 600
/ 700. All numeric data uses `tabular-nums`. Type ramp lives in
`tailwind.config.ts` (`xs … 3xl`).

### Spacing & radii

4-pixel grid, primary `4 / 6 / 8 / 12 / 16 / 20 / 24 / 32 / 40`.
Radii capped at `12px` (`rounded-xl`); cards/inputs use `6` (default).
**Never** `rounded-full` on big buttons or panels.

### Shadows

Subtle stacking only:

```
shadow-card  → 0 1px 0 0 rgba(0,0,0,.04), 0 1px 2px 0 rgba(0,0,0,.06)
shadow-pop   → popover lift
shadow-sheet → bottom sheet drop
```

### Motion

Framer-motion used for:

- Right info panel slide (200 ms, ease-out)
- Mobile bottom sheet drag + snap
- Accordion open/close (180 ms)
- Search popover fade

Hover transitions: `120-150ms ease-out` color only — no scale.

---

## Architecture

### Stores

| Store | Persist key | Notes |
|---|---|---|
| `useUIStore` | `eimar:ui` | sidebar mode, layer visibility/opacity, legend collapse, search/right-panel open |
| `useMapStore` | `eimar:map` | basemap, selection, hover, fly target queue, view state |
| `useWatchlistStore` | `eimar:watchlist` | persisted parcel cards |
| `useHistoryStore` | `eimar:history` | last 10 search entries |

### Map control plane

`MapCanvas` is the *only* component that talks to MapLibre. It exposes the
map via `window.__mlMap` and listens to `eimar:map:control` `CustomEvent`s
emitted by `MapHud` (zoom in/out/north/reset). Selection / hover / flyTo
are all driven from `useMapStore`.

### Search

`useSearch({query, mode, limit})` is a pure synchronous selector over the
in-memory dataset. The combobox is hand-rolled (no `cmdk`) using Radix
Popover + a thin `CommandRoot` keyboard handler. `Cmd/Ctrl+K` is registered
globally.

### Emsal

`lib/math/emsal.ts` is a **TypeScript port** of the mobile app's
`emsal_calculator.dart` contract — same Türkçe input keys (`taks`,
`kaks`, `gabariM`, …), same warning categories
(gabari aşımı, TAKS yoğunluğu, yol cephesi, ROI eşiği). Defaults match
the Flutter implementation (`katYüksekliği = 3 m`, `ortalamaDaire = 90 m²`).

`EmsalDialogContent` powers both the in-panel `Dialog` and the standalone
`/emsal` page. Two-column responsive layout, Türkçe `tr-TR`
`Intl.NumberFormat` for `₺` and `m²`, real-time validation with friendly
Turkish messages, and a Sıfırla (reset) action.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Map home — full app shell, country-level Türkiye view |
| `/sorgu/[adaParsel]` | Deep link, e.g. `/sorgu/1234-2?il=istanbul&ilce=besiktas`. Pre-selects the parcel and flies the map. Returns 404 with friendly Türkçe page if the slug is unknown. |
| `/emsal` | Standalone full-screen calculator (no map underneath) |

---

## Responsive

| Breakpoint | Layout |
|---|---|
| ≥ 1280 | Sidebar 280 · Map · Right panel 400 |
| 1024–1279 | Sidebar 64 (icon rail) · Map · Right panel 360 |
| 768–1023 | Sidebar = Sheet drawer · Right panel = overlay |
| < 768 | Drawer + full-bleed map + Mobile Bottom Sheet (peek 96 px / half 45vh / full 90vh) |

The mobile bottom sheet is hand-rolled with `framer-motion` `useDragControls`;
no `Vaul` dependency.

---

## Accessibility

- All interactive controls have `aria-label` / labels.
- Focus visible: 2 px ring on `--ring` (muted blue) with 2 px offset.
- Keyboard: `Cmd/Ctrl + K` opens search, `↑/↓` navigates results, `Enter`
  selects, `Esc` dismisses.
- Both light and dark themes pass WCAG AA on text/border contrast.
- Tabular numbers everywhere data is rendered.

---

## Mock data

`src/data/parcels.geo.json` ships **30** realistic parcel polygons clustered at
İstanbul (Beşiktaş Levent, Etiler, Kadıköy Caddebostan, Suadiye, Şişli
Mecidiyeköy/Nişantaşı, Üsküdar, Beyoğlu Cihangir), Ankara (Çankaya
Kavaklıdere, Gaziosmanpaşa, Çukurambar; Yenimahalle Demetevler, Batıkent),
İzmir (Konak Alsancak, Güzelyalı; Karşıyaka Bostanlı, Mavişehir; Bornova),
Bursa (Nilüfer Görükle, Özlüce; Osmangazi Soğanlı), Antalya (Muratpaşa
Lara, Kaleiçi; Konyaaltı Liman), and additional samples in Adana, Mersin,
Samsun, Trabzon, Konya, Kayseri.

Each parcel ships realistic plan use (`zoningType`), TAKS/KAKS, gabari, plan
notları, askı durumu, AFAD-temelli risk skorları, çevre erişilebilirlik
metrikleri ve yatırım skoru — see `src/types/parcel.ts`.

---

## Visual coherence checklist

- [x] Tabular numerics for every data cell
- [x] 1 px subtle borders, no 2-3 px brand-colored dividers
- [x] Restrained accent usage — devlet kırmızısı reserved for primary CTA, selection accent, watchlist active state
- [x] No neon, no glassmorphism, no oversized rounded fills
- [x] Carto Voyager / Dark Matter as restrained basemaps
- [x] Custom-rendered MapLibre HUD (zoom, compass, scale, coords, CRS chip)
- [x] Lacivert idari sınır + devlet kırmızısı seçim çizgisi
- [x] Zoning legend = single canonical color/stroke pair from `tokens.css`
- [x] Dark theme uses `#0B0F14` not pitch black

---

## Task 2 handoff

Components stubbed but disabled-with-tooltip ("Yakında") this task; ready for
Task 2:

| Stub | File | What's planned |
|---|---|---|
| 3D mode pill / `<ThreeDPreviewPanel>` | `components/gis/three-d-preview-panel.tsx`, `top-bar.tsx`, `map-hud.tsx` | Cesium-backed kütle modeli; switchable 2D/3D |
| `<TimelinePanel>` (Time Machine) | `components/gis/timeline-panel.tsx` | Year-scrubber to compare plan revisions on the same parcel |
| `<PlanChangeCard>` | `components/gis/plan-change-card.tsx` | Diff between plan onay tarihleri, including emsal/gabari delta |
| `<SatelliteCompareSlider>` | `components/gis/satellite-compare-slider.tsx` | Esri 2018 ↔ 2024 swipe compare |
| Askı overlay (`askida-overlay`) | `lib/maplibre/layers.ts` | Real askı polygons + countdown badges on the map |
| PDF Rapor | `right-info-panel.tsx`, `mobile-bottom-sheet.tsx` | Server-rendered PDF using a print-styled layout |
| Mapbox provider switching | `lib/maplibre/styles.ts` | Activate when `NEXT_PUBLIC_MAPBOX_TOKEN` is present |
| Backend swap | `app/providers.tsx` (QueryClient ready) | Replace `data/*` mocks with REST/GraphQL fetchers using TanStack Query |
| Real APIs | n/a | TKGM Parsel Sorgu, AFAD risk, askı (e-imar.gov.tr) |

The mock data layer is intentionally placed in `src/data/*` so it can be
replaced behind the same accessor functions (`getParcelById`,
`searchParcels`, `useParcel`, `useSearch`) without touching components.

---

## Out of scope

- Cesium 3D was deliberately not installed.
- No real authentication / no real APIs / no PDF export.
- No testing libraries — task scope.
- The Vite shell that previously occupied this folder has been removed.
