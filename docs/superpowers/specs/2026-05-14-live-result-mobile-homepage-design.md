# Phase 1 Design: Live Result Homepage and Mobile Flow

## Goal

Make the product feel usable before full official connector coverage exists. A first-time user should immediately understand what to do, run an ada/parsel or municipality-driven lookup on mobile, see which live sources were checked, and understand why a verified result is available or unavailable.

This phase does not fabricate TKGM, municipal, or e-Plan data. It productizes the existing honesty model and adds the interface contracts needed for later live connector expansion.

## Scope

Phase 1 combines four related improvements into one vertical user journey:

1. Homepage with three primary actions:
   - Ada/parsel sorgula
   - İl/belediye haritası
   - Örnek rapor gör
2. Mobile-first one-hand lookup flow:
   - Search
   - Source/probe status
   - Result summary
   - Map
   - Report call-to-action
3. Source health/probe presentation for TKGM, municipality, and e-Plan readiness.
4. Deployment-readiness surface that makes backend URL, env status, source probe status, and fallback causes visible to operators and explainable to users.

Full connector extraction for protected or undocumented official sources is out of scope for this phase unless a source already exposes a verified public contract. Protected, captcha, credentialed, or legal-agreement flows must remain blocked with explicit statuses.

## Current Context

The repository already has a backend-first honesty model:

- `src/website/website.service.ts` exposes `parcelWorkflow`, `municipalParcelWorkflow`, and `parcelReport`.
- `municipalParcelWorkflow` returns statuses such as `source_not_found`, `protected`, `method_contract_required`, and `not_ready` instead of inventing parcel geometry or zoning.
- `parcelReport` builds a report payload with `reportId`, `generatedAt`, `disclaimer`, `sections`, `provenance`, printable HTML, and a download filename.
- The canonical frontend is `frontend/`, a Next.js 14 App Router app.
- The current homepage is a generic feature grid; mobile still inherits a fixed desktop sidebar and dense map/search screens.

The main product gap is not data honesty. It is that honest states feel like missing product instead of a trustworthy source-verification journey.

## User Experience Design

### Homepage

Replace the generic feature grid with a clear action-first landing page.

Desktop layout:

- Left side: concise promise, official-data caveat, and primary ada/parsel form preview.
- Right side: live source panel showing TKGM, municipality, and e-Plan readiness states.
- Below hero: three asymmetric action blocks, not equal generic cards:
  - Ada/parsel sorgula: fastest route to the lookup flow.
  - İl/belediye haritası: municipality-first exploration for users who do not know parcel identifiers.
  - Örnek rapor gör: demonstrates the final trusted output before the user searches.

Mobile layout:

- Single column.
- Primary CTA first.
- Secondary actions as large thumb-friendly rows.
- No desktop sidebar overlay in the first viewport.
- Source caveat shown as short, plain Turkish: “Resmî belge değildir; kaynak ve tarih her sonuçta gösterilir.”

### Mobile Lookup Flow

The mobile flow should behave as a guided funnel rather than a dense GIS workspace.

1. Search step:
   - Province/district optional first.
   - Ada/parsel fields prominent.
   - “Belediye seçerek ilerle” secondary path.
2. Source check step:
   - Display source cards for TKGM, municipality, and e-Plan.
   - Each card shows status, checked time if available, and next action.
   - Status labels must distinguish `verified_live`, `public_metadata`, `method_contract_required`, `protected`, `not_ready`, and `source_not_found`.
3. Result step:
   - If verified data exists: show parcel identity, geometry availability, zoning summary if returned, and provenance.
   - If verified data does not exist: show the exact no-data reason and what can still be done.
4. Map step:
   - Mobile map opens as a focused view.
   - Result details appear in a bottom sheet, not a side panel.
   - Bottom sheet has collapsed, half, and expanded states.
5. Report step:
   - The report CTA is available for both verified and unavailable cases.
   - Verified reports emphasize source evidence.
   - Unavailable reports emphasize attempted sources, timestamps, and next verification steps.

### Report Trust Layer

Every result or report preview should include:

- Generated timestamp.
- Source list and status.
- Data type label: official, public metadata, derived, demo, unavailable.
- “Resmî değildir / doğrulama gerekir” disclaimer.
- Shareable link target, even if PDF generation is implemented later.
- Download/print affordance when printable HTML exists.

This turns “no result” into a useful audit artifact instead of a dead end.

## Backend and API Design

Phase 1 should standardize the BFF payload consumed by the homepage/mobile flow. The UI can be built against current endpoints, but the frontend adapter should normalize these fields:

```ts
type SourceProbeStatus =
  | "verified_live"
  | "official_contract_required"
  | "method_contract_required"
  | "protected"
  | "requires_credentials"
  | "captcha_required"
  | "public_metadata"
  | "not_ready"
  | "source_not_found"
  | "unavailable";

type ProductizedSourceProbe = {
  sourceId: string;
  sourceName: string;
  category: "tkgm" | "municipality" | "eplan" | "other";
  status: SourceProbeStatus;
  endpoint?: string;
  checkedAt?: string;
  dataType: "official" | "public_metadata" | "derived" | "demo" | "unavailable";
  message: string;
  nextAction?: string;
  evidenceHash?: string;
};
```

The first implementation should adapt existing `municipalParcelWorkflow`, `parcelWorkflow`, and `parcelReport` responses into this UI contract without changing legal boundaries. Later connector work can fill `verified_live` and `evidenceHash` when a real source response is available.

## Frontend Architecture

Use the canonical `frontend/` app.

Recommended implementation units:

- `frontend/app/page.tsx`
  - New action-first homepage.
- `frontend/components/home/HomeActionPanel.tsx`
  - Three primary actions and search entry.
- `frontend/components/home/SourceReadinessStrip.tsx`
  - TKGM/belediye/e-Plan readiness summary.
- `frontend/components/mobile/MobileLookupFlow.tsx`
  - Client component for step state on mobile.
- `frontend/components/mobile/MobileResultSheet.tsx`
  - Bottom-sheet result and report CTA.
- `frontend/lib/source-status.ts`
  - Status normalization, labels, severity, and next-action copy.
- `frontend/lib/report-preview.ts`
  - Report summary extraction from `parcelReport`.

The existing `Sidebar` should become responsive:

- Desktop: keep current fixed sidebar.
- Mobile: replace with compact top bar and bottom navigation, or hide on landing/lookup pages where the funnel needs the full viewport.

## Visual Direction

The interface should feel like a serious civic/GIS product, not a crypto dashboard or generic SaaS landing page.

- Typeface: keep existing Outfit for consistency.
- Palette: reduce the cyan/magenta split on primary flows. Use off-black/slate with one restrained cyan accent for action and status. Reserve red/amber/green for status semantics only.
- Layout: avoid equal three-card feature grids. Use a split hero on desktop and large stacked action rows on mobile.
- Motion: CSS-only transitions and tactile button feedback. Do not add animation libraries.
- Mobile density: one decision per screen section; minimum 44px tap targets; no horizontal overflow; avoid fixed `h-screen` for browser chrome stability.

## Error Handling and Empty States

No source or no result is a first-class state.

- `source_not_found`: show municipality/source not in registry and suggest municipality selection.
- `method_contract_required`: show source found but method contract unresolved.
- `protected`, `captcha_required`, `requires_credentials`: show that access cannot be bypassed.
- `not_ready`: show backend/env/config dependency.
- API failure: show retry plus diagnostic copy, not browser `alert`.

## Testing and Verification

Acceptance checks for implementation:

1. `npm run typecheck` and `npm run build` in `frontend/`.
2. Mobile viewport smoke test for homepage and lookup flow at 390px width.
3. Desktop smoke test for homepage at 1440px width.
4. UI adapter tests for status normalization:
   - `method_contract_required`
   - `protected`
   - `source_not_found`
   - `not_ready`
   - future `verified_live`
5. Manual check that no demo/metadata/unavailable state is labeled as official.

## Rollout Plan

1. Implement source-status normalization and copy.
2. Redesign homepage around the three actions.
3. Make navigation mobile-safe.
4. Add mobile lookup shell and bottom-sheet result pattern.
5. Wire existing BFF/report payloads into the source and report UI.
6. Add deploy/readiness indicators to the UI copy and operator-facing docs.

## Non-Goals

- Bypassing protected TKGM, municipal, or e-Plan access.
- Claiming official data from metadata-only responses.
- Building full PDF generation if printable HTML already exists and can be surfaced.
- Replacing the full desktop GIS workspace in this phase.
- Adding new paid dependencies for animation or UI primitives.
