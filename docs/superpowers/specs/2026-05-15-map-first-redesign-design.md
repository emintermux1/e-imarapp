# Map-first E-İmar redesign

## Direction

Approved direction: **Map-first Command Center**. The web product and Flutter mobile app should feel like one product family: full-screen map first, fast parsel/plan commands, tactile bottom sheets, restrained official-data messaging, and a premium dark-green civic GIS identity.

## Visual references distilled

- Existing E-Plan/TKGM flows: official top bars, il/ilçe/mahalle/ada/parsel forms, layer catalogs, plan details, and map-first spatial context.
- New parcel app references: dark green promotional panels, large rounded phone frames, satellite/map mode switching, blue parcel polygons, white bottom sheets, route/PDF/favorite actions, recent searches, and multi-parcel comparison.
- Avoid: old blue rectangular app bars, generic 3-card marketing grids, purple/neon gradients, flat white side menus, and toy glass effects.

## Shared design system

- Palette: deep civic green and off-black as the product base, parchment/off-white sheets, muted cadastral blue for parcel outlines, warm amber only for secondary route/report emphasis.
- Typography: high-weight rounded sans for headlines, tabular figures for area/ada/parsel values, strong small-caps labels for source/status metadata.
- Surfaces: nested rounded containers with inner highlights, map overlays, bottom sheets, and floating command bars. Cards exist only when hierarchy needs elevation.
- Motion: spring-feeling transitions, press feedback, staggered entry where already supported. Avoid layout-triggering animation.

## Web scope

- Update global tokens and font to the new green/parchment GIS identity.
- Reframe `AppShell` as a map-first surface with:
  - compact floating top command bar,
  - dark-green left command drawer,
  - reference-inspired desktop welcome/command panel over the map,
  - stronger mobile map chrome and bottom sheet affordance.
- Redesign mobile bottom sheet header/action area to expose parsel, rota, report/PDF, favorite, share, and Google Earth-style actions.
- Keep existing data flow, stores, MapLibre/Cesium logic, backend source badges, watchlist, askı, compare, and live-source status behavior intact.

## Flutter scope

- Update Material theme to deep-green civic identity and squircle components.
- Make the app open as a map workspace, not a form-first utility.
- Redesign:
  - bottom navigation as `Harita / Analiz / Favoriler / Ara`,
  - map workspace with satellite-style canvas, instruction card, right-side controls, map-mode cards, and parsel preview bottom sheet,
  - search screen as a modern “Bölgesel akıllı arama” flow with recent searches and two-mode form,
  - parcel detail as a white action sheet with route/favorite/analysis/PDF actions,
  - watchlist as grouped favorites resembling the reference list.

## Acceptance checks

- Web typecheck/build should pass for `apps/e_imar_web`.
- Flutter analysis or tests should pass when Flutter is available.
- Visual smoke should confirm the web app renders the new map-first chrome on localhost and mobile-width viewport.
