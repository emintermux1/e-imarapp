# E-İmar Web — Türkiye Parsel · Plan · GIS

Production-grade Türkçe e-imar / parsel / cadastral GIS frontend, built with
Next.js 14 App Router. The visual language is intentionally *dense and
restrained* — TKGM Parsel Sorgu, sahibinden, ArcGIS Online and Bloomberg
Terminal are the references; we deliberately avoid the marketing-landing,
neon, glassmorphism, toy-rounded vocabulary.

This is the canonical polished GIS product frontend for the repository at
`apps/e_imar_web`. Older frontend experiments live under
`_archive/legacy-frontends/` as reference-only code unless explicitly migrated.

> This package replaces the previous Vite shell. The Flutter mobile app at
> `apps/e_imar_mobile/` is **not** modified by this work.

---

## Run

```bash
# from repo root
npm install --prefix apps/e_imar_web
npm run web:dev   # http://localhost:3000

# typecheck / build / start / smoke
npm run web:typecheck
npm run web:lint
npm run web:build
npm run web:preview
npm run web:smoke
```

The repo-root `web:*` scripts intentionally point to this canonical app.

The first install runs `scripts/copy-cesium-assets.mjs` (also wired to
`predev` and `prebuild`). It copies Cesium's runtime workers, widgets,
assets, and ThirdParty bundles from `node_modules/cesium/Build/Cesium/` into
`public/cesium/`. The directory is `gitignore`d.

```bash
# Manually re-copy after a Cesium upgrade
npm --prefix apps/e_imar_web run copy:cesium
```

### Environment

Out of the box, the app uses fully token-free providers:

- **Carto Voyager** raster tiles (light)
- **Carto Dark Matter** raster tiles (dark)
- **Esri World Imagery** raster tiles (uydu)
- **OpenTopoMap** raster tiles (topografik)
- **OpenStreetMap** raster imagery on the Cesium 3D globe (no ion key required)

Optional Mapbox switching is gated behind:

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxx
```

If the variable is set, a future enhancement can swap in Mapbox styles. This
work does not install the Mapbox SDK.

The FastAPI adapter uses:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

When the variable is omitted, `http://localhost:8000/api/v1` is the default.
Live API, local fallback, computed, and demo data are visibly labelled in the
search results, map selection, right panel workflow strip, and trust section.

Parcel geometry source mode is explicit:

```
NEXT_PUBLIC_EIMAR_DATA_MODE=demo|api|vector-tile
NEXT_PUBLIC_EIMAR_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL=http://localhost:7800/public.parcels/{z}/{x}/{y}.pbf
NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK=true
```

Development may fall back to labelled synthetic parcels. Production does not
silently draw demo parcels when `api` or `vector-tile` is requested without a
configured endpoint; the map remains visible and the parcel layer reports a
production unavailable state.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14** App Router (TypeScript strict) |
| Styling | **Tailwind CSS v3** + `clsx`/`tailwind-merge`/`cva` |
| State | **Zustand** with `persist` (UI, Map, Watchlist, History) |
| Async | **@tanstack/react-query** (mock fetcher boundary, ready for backend swap-in) |
| 2D Map | **MapLibre GL JS** (no token); style swapper for Voyager/Dark/Satellite/Topographic |
| 3D Map | **Cesium 1.141** (raw, no resium) — lazy-loaded; OSM imagery, ellipsoid terrain |
| Theme | **next-themes** (`class` strategy) |
| Motion | **framer-motion** with global `MotionConfig` honoring `prefers-reduced-motion` |
| Primitives | **@radix-ui/react-***: accordion, dialog, dropdown-menu, popover, scroll-area, slider, switch, tabs, tooltip, separator, label |
| Icons | **lucide-react** |

We deliberately avoid pulling in heavy dribbble UI libraries; primitives are
hand-built where Radix isn't necessary.

---

## File Tree (highlights)

```
apps/e_imar_web/
  scripts/
    copy-cesium-assets.mjs               # postinstall + predev + prebuild
  public/cesium/                         # auto-populated, gitignored
  src/
    app/
      layout.tsx, page.tsx, globals.css, providers.tsx
      sorgu/[adaParsel]/page.tsx         # deep link + print header
      sorgu/[adaParsel]/not-found.tsx
      sorgu/[adaParsel]/parcel-deep-link-bootstrap.tsx
      emsal/page.tsx                     # standalone calculator
    components/
      ui/                                # button, accordion, dialog, popover, tooltip, skeleton…
      layout/
        app-shell.tsx, top-bar.tsx, left-sidebar.tsx,
        right-info-panel.tsx, mobile-bottom-sheet.tsx,
        brand-mark.tsx, header-breadcrumb.tsx, theme-toggle.tsx
      map/
        map-shell.tsx                    # 2D ↔ 3D crossfade orchestrator
        map-canvas.tsx                   # MapLibre wrapper (parcels, askı, risk grid)
        map-hud.tsx                      # zoom, compass, scale, coords, mode pill
        compare-map-pair.tsx             # split-pane synced 2D maps (time machine)
        satellite-compare-overlay.tsx    # full-bleed satellite swipe overlay
        aski-popover.tsx                 # side popover for askı polygon clicks
        layer-toggle-list.tsx, basemap-switcher.tsx
      cesium/
        cesium-canvas.tsx                # main 3D Viewer w/ parcel extrusion
        cesium-mini-canvas.tsx           # 220 px preview viewer
        cesium-canvas-lazy.tsx           # next/dynamic lazy boundary
      gis/
        timeline-floating.tsx            # bottom-of-map year scrubber
        timeline-panel.tsx               # in-panel TimelinePanel (replaces stub)
        plan-change-card.tsx             # diff card for plan revisions
        satellite-compare-slider.tsx     # in-panel compare preview + tam ekran CTA
        three-d-preview-panel.tsx        # in-panel mini Cesium scene + emsal envelope
        section-3d-analizleri.tsx        # 3D-only side panel: sun/shadow/corridor
        risk-indicator.tsx               # tooltip-enriched risk meter
        data-card.tsx, parcel-card.tsx, zoning-badge.tsx,
        layer-toggle.tsx, gis-legend.tsx
      info/
        section-konum.tsx, section-imar.tsx, section-plan-notlari.tsx,
        section-riskler.tsx, section-aski.tsx, section-cevre.tsx,
        section-gecmis.tsx, section-yatirim-skoru.tsx
      sidebar/, search/, emsal/
    lib/
      utils.ts, format.ts                # Türkçe / tabular formatlayıcılar
      math/emsal.ts                      # Emsal hesabı (Dart paritesi)
      maplibre/styles.ts, maplibre/layers.ts
      cesium/cesium-init.ts              # CESIUM_BASE_URL + lazy import
      cesium/use-cesium-viewer.ts        # Viewer hook
      cesium/build-extrusion.ts          # parcel → entity helpers
    data/
      parcels.geo.json (~30 polygon)
      historical-snapshots.ts            # year-by-year parcel snapshots + plan changes
      aski-polygons.ts                   # askı overlay GeoJSON
      risk-grid.ts                       # synthesized AFAD-style risk grid
      provinces.ts, districts.ts, neighborhoods.ts,
      zoning.ts, plan-notes.ts, aski-list.ts,
      risk-scores.ts, environment.ts, investment-scores.ts,
      belediye.ts, parcels.ts (accessor)
    stores/
      ui-store.ts                        # mapMode, timelineYear, askiMode, shadow…
      map-store.ts, watchlist-store.ts, history-store.ts
    hooks/
      use-prefers-reduced-motion.ts      # MotionConfig source + duration helper
      use-delayed-display.ts             # 200 ms guard for skeletons
      use-parcel.ts, use-search.ts, use-mounted.ts, use-media-query.ts
    types/
      parcel.ts, zoning.ts, geo.ts
    styles/
      tokens.css                         # tek kaynak — light + dark CSS vars
      print.css                          # @media print: hides chrome on /sorgu
```

---

## Design system

(unchanged from Task 1; see git history for tokens.)

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

Zoning fills, dark variants, and risk severity ramps follow the same
strict palette discipline; no neon, no glassmorphism, no oversized
rounded fills.

### Motion

Framer-motion's global `MotionConfig` is wired in `app/providers.tsx`. It
reads `prefers-reduced-motion` via `usePrefersReducedMotion()` and
collapses every animation duration to `0` when the user has reduced
motion enabled. CSS animations also degrade via a global
`@media (prefers-reduced-motion: reduce)` rule in `globals.css`.

Concrete durations:

| Surface | Duration | Easing |
|---|---|---|
| Right info panel slide-in | 220 ms | ease-out |
| Right info panel slide-out | 180 ms | ease-in |
| Mobile bottom sheet snap | spring (stiffness 320, damping 32) | — |
| Accordion expand/collapse | 180 ms | + opacity fade |
| Layer toggle eye icon | 120 ms | color-only |
| Tab indicator | layout animation | spring |
| 2D ↔ 3D mode crossfade | 220 ms | ease-out |
| Search dropdown | 120 ms | + 4 px slide |
| Skeleton flash guard | 200 ms display delay | — |

All hover transitions: `120-150 ms ease-out` color-only — no scale.

---

## 3D mode (Cesium)

The TopBar's segmented `2D / 3D` toggle controls `useUIStore.mapMode`. When
it flips to `3d`:

1. The MapLibre canvas fades to opacity 0 and is parked offscreen.
2. The Cesium viewer is **lazy-loaded** via `next/dynamic` (SSR off). The
   first mount also installs `window.CESIUM_BASE_URL = "/cesium/"` and
   injects the `widgets.css` link.
3. Parcels are drawn via two `Entity`s each: a flat ground polygon and an
   extruded building. Heights come from `gabariM` (preferred) or
   `katSiniri × 3 m`.
4. The selected parcel switches its outline to **devlet kırmızısı** and
   lifts an extra 1.5 m so it pops above neighbours.
5. The camera flies to the parcel's bounding rectangle (not just the
   centroid) so the framing always shows the full lot.

### 3D Analizleri (right side panel)

Visible only in 3D, anchored next to the right info panel:

- **Saat slider** (00–23) and **Ay slider** (1–12); when "Gölge analizini
  göster" is on we set `viewer.shadows = true`,
  `scene.globe.enableLighting = true`, and
  `viewer.clock.currentTime = JulianDate(year=2024, month, day=15, hour)`
  computed at the parcel's local solar offset (1 h per 15° of longitude),
  so 12:00 means **local solar noon** rather than UTC noon.
- **Emsal Envelope** wireframe — square envelope at parcel centroid sized
  `√(arsa × TAKS)` per side and `katSayısı × 3 m` tall, drawn as a thin
  blue outline with 4 % white fill. Toggled by `useUIStore.emsalWireframe`.
- **Görüş Koridoru** — a translucent extruded prism extending 280 m at
  azimuth 35° from the parcel centroid, suggesting line-of-sight blocked
  by neighbouring extrusions. Implementation is intentionally a visual
  stub; it is not raycast against actual geometry.

### Limitations / TODOs

- **Terrain**: we use `EllipsoidTerrainProvider` because Cesium World
  Terrain requires an ion access token. To add real terrain, set up an
  ion key, then in `use-cesium-viewer.ts` swap the `terrainProvider`:
  ```ts
  terrain: Cesium.Terrain.fromWorldTerrain()
  ```
- **Photorealistic 3D Tiles**: also gated behind ion. Would replace the
  custom polygon extrusion with the Bing/PhotorealisticTiles dataset.
- **Building footprint accuracy**: extrusions follow the parcel boundary,
  not the actual building footprint within the parcel. Real production
  would integrate cadastral building polygons (TKGM Bina Verisi).

---

## Time Machine

`TimelinePanel` (in-panel) and `TimelineFloating` (bottom-of-map) both
drive `useUIStore.timelineYear`. Range is 2010–2024 in 1-year steps.

When the year changes:

1. **Selected parcel data** for the right info panel switches to the
   nearest historical snapshot (`data/historical-snapshots.ts`):
   - 5 parcels have explicit narrative arcs (Levent yeşil → askı tadilatı,
     Çukurambar tarım → konut, Görükle sanayi → karma, etc.)
   - Other parcels fall through to a synthesised "old plan, lower
     yoğunluk" snapshot for years before 2014.
2. **MapLibre parcel-fill expression** is rebuilt as a per-parcel `match`
   against the historical zoning, so the entire map re-tints to that
   year's plan view.
3. **3D extrusions** re-color to match the historical zoning, and any
   field-level overrides (gabari, kat) update the extrusion height.

### Karşılaştır mode

Toggling the "Karşılaştır" switch in TimelinePanel sets
`compareMode = "timeMachine"`, which swaps the single MapCanvas for a
side-by-side `<CompareMapPair>`. Both panes use the same basemap and a
synced camera (mutual `move` listeners with a re-entrancy guard).

In 3D the toggle is disabled with a "3D'de karşılaştırma desteklenmiyor"
hint — keeping complexity bounded.

### Plan değişikliği geçmişi

`SectionGecmis` renders a vertical timeline of `<PlanChangeCard>`s,
sourced from `getPlanChanges(parcelId)` in `historical-snapshots.ts`.
Each card:

- Shows date, kategori dot, başlık and ozet
- Renders 1-3 field-level diff badges (eski → yeni) with up/down arrows
- Has a "Time Machine'a Aç" button that sets the slider to that year and
  highlights the card with a soft red ring + outer glow

---

## Askı haritası

`useUIStore.layerVisibility["askida-overlay"]` (Katmanlar > Plan) and the
TopBar `aktif askı` pill both control the same layer.

Visualisation (one MapLibre source, three layers):

| `askiStatus` | Fill | Outline | Hatch |
|---|---|---|---|
| `askida` | 25 % lacivert | dashed lacivert | — |
| `onaylandi` | 18 % emerald | solid emerald | — |
| `reddedildi` | 18 % danger | solid danger | — |
| `donusum` | 22 % orange | solid orange + 5 px dashed echo | yes |

Clicking any polygon opens a side popover (NOT the right info panel)
with: askı no, durum, başlangıç/bitiş tarihleri, plan adı, belediye,
kalan gün countdown, and a **Detay** link to the matched parcel. ESC
closes.

The `Askı Modu` button in the TopBar toggles the layer on/off and
auto-pans to the nearest active askı polygon.

---

## Satellite compare slider

Two flavours:

1. **In-panel preview** (`<SatelliteCompareSlider>`): a CSS-driven 128 px
   sliver inside `SectionGecmis`. Drag the handle to scrub the split. A
   "Tam Ekran" button promotes the comparison to:
2. **Full-bleed overlay** (`<SatelliteCompareOverlay>`): mounts two extra
   MapLibre instances pinned to the main map's camera. Right pane uses
   Esri World Imagery as "Güncel"; left pane reuses the same tile source
   with a CSS `sepia(0.55) saturate(0.5) contrast(1.05) brightness(0.95)`
   filter as a placeholder for an archival raster (see TODO).

The TopBar `Karşılaştır` button toggles the overlay on/off; it is
disabled in 3D mode.

### Limitations / TODOs

- The "Eski" raster is a sepia-tinted version of the current Esri World
  Imagery because there is no public free archived satellite tile service
  with consistent coverage of Türkiye. Real production would integrate
  Maxar/Planet historic imagery via WMTS.

---

## Risk göstergesi & risk haritası

- `<RiskIndicator>` now wraps a Radix tooltip. Hover (or focus) shows a
  card with the AFAD/MTA/DSİ/OGM source label, the score level (Çok Düşük
  → Çok Yüksek), and a contextual sentence — e.g. *"Deprem 4: Yüksek risk
  · 1. derece deprem bölgesine yakın; sismik izolasyon değerlendirilmeli."*
- A new **Risk Haritası** layer toggle (Katmanlar > Risk) renders a
  Gaussian-composed circle layer over the basemap. The grid is generated
  client-side in `data/risk-grid.ts` from 13 high-risk centers (Marmara,
  Doğu Anadolu, Marmaris fault, etc.) at ≤ 30 % opacity.

---

## Print styles (`/sorgu/[adaParsel]`)

Set up via `src/styles/print.css`, scoped to `body[data-route="parcel"]`
which is tagged at the top of the deep-link page.

When printed:

- TopBar, sidebar, mobile sheet, MapHud, FAB cluster, MapLibre/Cesium
  canvases, footer action row are all hidden.
- The right info panel is promoted to a static, full-width A4 layout
  with its inner accordion content forced visible.
- A page header (`.print-only`) renders on top with the BrandMark, ada/parsel
  number, mahalle/ilçe/il, and current date in `tr-TR` long format.

Try it: navigate to `/sorgu/1234-2?il=istanbul&ilce=besiktas`, then `Ctrl+P`.

---

## Bundle size impact

Production build (`next build`) currently emits these chunks:

| Chunk | Size | Notes |
|---|---|---|
| First Load JS (homepage) | **439 kB** | MapLibre + Radix + framer-motion |
| `/emsal` route | **126 kB** | Calculator only, no map |
| `/sorgu/[adaParsel]` | **439 kB** | Same as homepage; Cesium not in initial |
| Cesium dynamic chunk | **~1.1 MB gzipped (~4.6 MB raw)** | Loaded on first 3D toggle |
| Static assets `/public/cesium/` | **~7.6 MB on disk** | Workers/Widgets/Assets/ThirdParty |

The initial render does **not** download Cesium; only after the user
toggles 3D mode (in TopBar pill, in `MapHud`, or via a `setMapMode("3d")`
call from any panel) does the Cesium chunk fetch.

If 3D toggling is found to block the main thread > 1 s on slower
hardware, a thin progress bar already renders in the lazy `loading:` slot
while Cesium downloads.

---

## Architecture (extended)

### Stores

| Store | Persist key | Notes |
|---|---|---|
| `useUIStore` | `eimar:ui` | sidebar mode, layer visibility/opacity, legend collapse, search/right-panel open, **mapMode (2d/3d), timelineYear, timelineCompareYear, compareMode, askiMode, shadowEnabled, sunHour, sunMonth, emsalWireframe, viewCorridor** |
| `useMapStore` | `eimar:map` | basemap, selection, hover, fly target queue, view state |
| `useWatchlistStore` | `eimar:watchlist` | persisted parcel cards |
| `useHistoryStore` | `eimar:history` | last 10 search entries |

The new UI fields are persisted only where useful (`mapMode`,
`emsalWireframe`, `sunHour`, `sunMonth`); compare/timeline state resets
on reload.

### Map control plane

`MapShell` is the orchestrator. It always renders `MapCanvas` (or, in
time-machine compare mode, `CompareMapPair`) under a motion-driven
opacity layer. When 3D activates, `CesiumCanvasLazy` (next/dynamic, SSR
off) overlays on top with a 220 ms crossfade.

`MapCanvas` is still the single MapLibre owner; it now also handles askı
overlay, risk grid, and historical zoning re-color via paint expression
swap.

### Search

Search now tries FastAPI first for parcel queries:

- `1234/2` style queries call `/parsel?ada=1234&parsel=2`
- free text parcel search calls `/parsel/search?query=...`
- coordinate parsing remains immediate and local

When FastAPI is unavailable or has no usable parcel result, the UI falls back
to the bundled demo parcel set and shows `Yerel yedek` / `Demo veri` badges
instead of presenting fallback values as official.

### Emsal

The calculator still uses the local `lib/math/emsal.ts` core for real-time
feedback. For live API parcels with geometry, the dialog can also call
`/simulation/compliance` via the `API ile doğrula` action and renders returned
violations/compliance status inline.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Map home — full app shell, country-level Türkiye view |
| `/sorgu/[adaParsel]` | Deep link, e.g. `/sorgu/1234-2?il=istanbul&ilce=besiktas`. Pre-selects parcel and flies the map. **Print-friendly** via @media print. 404 with friendly Türkçe page if slug unknown. |
| `/emsal` | Standalone full-screen calculator (no map underneath) |

---

## State of polish

### Shipped

- 2D ↔ 3D toggle with crossfade; Cesium lazy-loaded, OSM imagery, ellipsoid terrain
- Parcel extrusion in 3D with zoning fill + selection accent
- Sun/shadow analysis (saat + ay sliders, real solar position via local-time JulianDate)
- Görüş koridoru visual stub
- Emsal envelope wireframe in main 3D + mini preview
- TimelinePanel (in-panel + floating) with year scrubber 2010–2024
- Karşılaştır mode (split-pane synced 2D maps)
- Askı overlay layer (4 status styles + hatched dönüşüm), clickable popover, top-bar pill
- PlanChangeCard vertical timeline in SectionGecmis with deep-link to Time Machine
- SatelliteCompareSlider — inline preview + tam ekran overlay with draggable handle
- RiskIndicator with Radix tooltip
- Risk haritası heatmap grid layer
- Animations: panel slides, sheet snap, accordion, mode toggle indicator, search dropdown
- `prefers-reduced-motion` honored via MotionConfig + global CSS rule
- Skeleton refinement: real-shape placeholders, 200 ms display delay
- Print styles for `/sorgu/[adaParsel]`
- README expanded; `prebuild` / `predev` / `postinstall` Cesium asset copy

### Remaining backend integration TODOs

| Surface | What's needed | Notes |
|---|---|---|
| **TKGM Parsel Sorgu API** | Expand current FastAPI adapter coverage beyond search/detail cache | `useSearch` now prefers `/parsel` and `/parsel/search`, then falls back to local demo data with visible badges. |
| **e-Plan / askı feed** | Replace `data/aski-list.ts` and `data/aski-polygons.ts` with the official belediye askı service | Current polygons are synthetic 0.005°-by-0.0035° rectangles around realistic city centroids. |
| **AFAD risk** | Replace `data/risk-grid.ts` with AFAD's WMS / GeoJSON risk service | Current grid is a 14×8 Gaussian over 13 high-risk centers. |
| **Plan değişikliği tarihçesi** | Replace `data/historical-snapshots.ts` with TKGM plan tadilat geçmişi | 5 parcels have explicit history arcs; rest synthesise. |
| **Cesium World Terrain** | Acquire ion access token; swap `EllipsoidTerrainProvider` → `Terrain.fromWorldTerrain()` | Required for accurate elevation in 3D. |
| **Photorealistic 3D Tiles** | ion or Google Maps Photorealistic 3D Tiles | Replaces the custom polygon extrusion with the real building dataset. |
| **Archival satellite imagery** | Replace the sepia-filtered placeholder in `<SatelliteCompareOverlay>` with Maxar/Planet historic WMTS | Current "Eski" pane reuses Esri World Imagery with a CSS sepia filter. |
| **PDF Rapor server endpoint** | Harden/report polling once backend report jobs become asynchronous | Right panel calls `/reports/generate` for live API parcels and opens `pdf_url` when returned. |
| **Mapbox provider switching** | Activate when `NEXT_PUBLIC_MAPBOX_TOKEN` is present | Stub already present in `lib/maplibre/styles.ts`. |
| **Backend swap** | TanStack Query is wired; replace mock fetcher with real backend | `app/providers.tsx` already has the QueryClient. |

---

## Mock data

(parcels list unchanged from Task 1 — 30 İstanbul/Ankara/İzmir/Bursa/Antalya
+ secondary city polygons.)

New for this task:

- `src/data/historical-snapshots.ts` — 5 parcels with rich plan-change
  arcs (Beşiktaş Levent, Konak Alsancak, Çankaya Çukurambar, Nilüfer
  Görükle, Muratpaşa Lara). Other parcels fall through to a generic
  "older plan" synthesizer for pre-2014 years.
- `src/data/aski-polygons.ts` — 7 polygons covering the 5 askı listesi
  entries plus Fatih dönüşüm and Çankaya park aktarması.
- `src/data/risk-grid.ts` — 13 risk centers, ~120 grid points after
  threshold filtering.

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
- [x] 3D mode reuses the same zoning palette for extrusion fills
- [x] Animations all under 250 ms; reduced-motion honored everywhere
- [x] Skeletons match real layout shape, not generic bars

---

## Out of scope

- Cesium ion features (World Terrain, Photorealistic 3D Tiles, Geocoding).
- Real authentication / real APIs / server-side PDF export.
- No testing libraries — task scope.
- The Vite shell that previously occupied this folder remains removed.
