# Frontend Task Pack — Sprint 1

This pack is implementation-ready and aligned with backend/BFF contracts already in repository.

## 1) Figma Frame List

Use this exact frame naming to keep dev/design handoff deterministic.

### Foundation
1. `00-DesignTokens-Color`
2. `00-DesignTokens-Typography`
3. `00-DesignTokens-Spacing`
4. `00-Icons-MapAndStatus`

### Core website frames
5. `01-Homepage-Desktop`
6. `01-Homepage-Tablet`
7. `01-Homepage-Mobile`
8. `02-MapWorkspace-Desktop-Default`
9. `02-MapWorkspace-Desktop-ParcelSelected`
10. `02-MapWorkspace-Mobile-BottomSheet`
11. `03-ParcelAnalysis-Desktop`
12. `03-ParcelAnalysis-Mobile`
13. `04-PlanNoteExplain-Desktop`
14. `04-PlanNoteExplain-Mobile`
15. `05-WorkspaceDashboard-Desktop`
16. `05-WorkspaceDashboard-Mobile`

### State frames (must-have)
17. `90-States-Loading`
18. `90-States-Empty`
19. `90-States-Error`
20. `90-States-NotReady`
21. `90-States-RequiresCredentials`

### Interaction overlays
22. `95-LayerCatalog-Open`
23. `95-ParcelDetailSheet-Expanded`
24. `95-FilterPanel-Mobile`

---

## 2) Component Priority Order (build order)

Build in this order for fastest integration:

1. `AppShell` (header, layout regions)
2. `HomepageQueryCard`
3. `WorkspaceShell`
4. `MapCanvasAdapter`
5. `ParcelSearchPanel`
6. `LayerCatalogDrawer`
7. `ParcelDetailSheet`
8. `PotentialSummaryCard`
9. `PlanNoteExplainCard`
10. `StatusBanner` (maps backend readiness states)
11. `WorkspaceTabs` (history/favorites/subscriptions)
12. `ReportActionPanel`

Dependencies:
- `MapCanvasAdapter` depends on map SDK integration.
- `PotentialSummaryCard` depends on `/website/bff/parcel-workflow`.
- `PlanNoteExplainCard` depends on `/website/bff/plan-note-explain`.

---

## 3) Sprint-1 Implementation Checklist

## A. Setup and architecture
- [ ] Create frontend app scaffold (Next.js or preferred web stack)
- [ ] Add shared API client with typed request/response adapters
- [ ] Add environment management (`API_BASE_URL`, session config)
- [ ] Add global error boundary and route-level loading patterns

## B. API integration baseline
- [ ] Integrate `GET /website/bootstrap`
- [ ] Integrate `POST /website/session/start`
- [ ] Integrate `POST /website/session/verify`
- [ ] Integrate `POST /website/bff/parcel-workflow`
- [ ] Integrate `POST /website/bff/plan-note-explain`
- [ ] Integrate `GET /website/workspace/:userReference`

## C. Homepage
- [ ] Implement hero query card (İl/İlçe/Mahalle/Ada/Parsel)
- [ ] Submit parcel query and route to map workspace
- [ ] Render value proposition cards and trust strip

## D. Map Workspace
- [ ] Implement desktop 3-region layout
- [ ] Implement mobile map + bottom sheet layout
- [ ] Implement parcel search panel
- [ ] Implement layer catalog drawer and opacity controls
- [ ] Render selected parcel details

## E. Parcel analysis
- [ ] Render potential summary from workflow payload
- [ ] Add optional emsal/share input and result panel
- [ ] Implement analysis CTA flow

## F. Plan note explain
- [ ] Build explain panel/page
- [ ] Render summary, bullets, risks, uncertainties
- [ ] Handle `requires_credentials` state explicitly

## G. Workspace dashboard
- [ ] Implement history tab
- [ ] Implement favorites tab
- [ ] Implement subscriptions tab

## H. State handling and resilience
- [ ] Map all backend statuses: `ok`, `empty`, `not_ready`, `requires_credentials`, `unavailable`
- [ ] Add loading/empty/error/not-ready/requires-credentials UI states
- [ ] Ensure no fake derived zoning values are shown

## I. Performance and QA
- [ ] Lighthouse baseline for homepage and workspace
- [ ] Verify mobile interactions and panel gestures
- [ ] Ensure keyboard accessibility for filter/layer controls
- [ ] Add analytics events (`query_submitted`, `parcel_selected`, `analysis_opened`)

---

## 4) Definition of Done (Sprint-1)

Sprint-1 is done when:
- Homepage query -> map workspace flow works end-to-end against real backend.
- Parcel workflow and plan-note explain are live in UI.
- Workspace dashboard loads real history/favorites/subscription data.
- All backend readiness states are represented and testable in UI.
- No mock parcel/zoning values are used in production paths.
