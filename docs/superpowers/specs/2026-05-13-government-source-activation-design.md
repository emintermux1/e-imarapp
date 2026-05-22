# Government source activation design

> Historical PR #123 design note. Current runtime documentation treats the Docker-backed API as FastAPI and the canonical frontend as `apps/e_imar_web`; older NestJS/frontend/mobile references below are preserved as project history, not current implementation guidance.

## Goal

Activate every usable Turkish government and municipal data source in the app and website without fabricating official data or bypassing protected access. The product will aggressively discover and use public endpoints, while clearly marking TKGM, e-Devlet, MAKS, or municipal flows that require credentials, captcha handling, or legal data-sharing agreements.

## Scope

This implementation targets the current NestJS backend, Next.js web app, and Flutter mobile app on PR #123.

In scope:
- Public discovery and health checks for registered national and municipal sources.
- Capability classification for parcel, zoning, plan, askı, basemap, address, satellite, WMS/WFS, ArcGIS REST, Netcad KEOS, WebGIS, eKent, and generic municipal portals.
- Runtime source activation responses that separate active public endpoints from blocked/protected sources.
- Website and mobile source coverage/readiness UI updates.
- Provenance labels on every returned source result.
- Tests for source activation behavior and existing merge-conflict-sensitive flows.

Out of scope for this pass:
- Storing institutional credentials.
- Solving captcha or scraping behind login walls.
- Claiming TKGM/MAKS/e-Devlet production data without approved integration details.
- Building a persistent ingestion database if `DATABASE_URL` is not configured.

## Architecture

### Backend source activation layer

Add a source activation layer on top of `src/sources/source-registry.ts` and existing connector discovery services.

The layer produces one normalized record per source:
- `sourceId`, `name`, `jurisdiction`, `category`, `homepageUrl`.
- `accessStatus`: registry value plus runtime status.
- `activationStatus`: `active`, `blocked`, `needs_contract`, `unavailable`, or `metadata_only`.
- `capabilities`: normalized data capabilities.
- `usableEndpoints`: public endpoints that passed probe checks.
- `blockedReason`: credential, captcha, legal agreement, rate limit, unsupported contract, or endpoint unavailable.
- `nextAction`: operator-facing activation step.
- `provenance`: source registry, probe endpoint, connector kind, and confidence.

This layer reuses:
- `DiscoveryService.buildCandidateEndpoints` and `HttpProbeService.probe` for safe public probing.
- `NetcadKeosService` for method-contract discovery where public WSDL/HTML is available.
- `OgcDiscoveryService` for WMS/WFS catalog metadata.
- `SourcesService` for registry filtering and municipal lookup.

It must not call protected endpoints after detecting `requires_credentials`, `captcha_required`, or `requires_legal_agreement`.

### Public endpoint normalization

For public sources, normalization is capability-first:
- WMS/WFS/TUCBS/Atlas/ÇŞİDB: expose catalog/layer metadata and map layer readiness.
- ArcGIS REST: expose service/layer metadata and map layer readiness.
- Netcad KEOS/WebGIS/eKent: expose homepage/service health, discovered service endpoints, and method-contract readiness; only call data methods after a public contract is detected.
- e-Plan: expose plan catalog/readiness and public plan metadata where available.
- TKGM/MAKS/e-Devlet: expose active registry presence, legal/credential requirements, and disabled public automation until approved access is configured.

### API surface

Add or extend backend endpoints with website/mobile-friendly responses:
- `GET /sources/activation` for complete activation state.
- `GET /sources/activation/summary` for counts grouped by status, category, and jurisdiction.
- `POST /connectors/public-health` remains the explicit live-probe trigger with rate limits.
- `GET /website/bootstrap` includes source activation summary.
- Existing municipal parcel workflow consumes activation state instead of returning only static registry readiness.

### Web and mobile UX

The UI will make source status obvious:
- Active public sources: show provider name, capability, endpoint type, last check, and provenance.
- Blocked sources: show why blocked and the exact requirement, e.g. `resmi protokol`, `kurumsal credential`, `captcha/login`, or `method contract required`.
- Parcel/plan results: never show `official` unless the source result is genuinely official and legally usable.
- Empty states: explain whether the issue is missing data, protected access, or an unsupported endpoint contract.

The existing source coverage panels are the right home for this; avoid adding unrelated screens unless necessary.

## Error handling and safety

- All public probing is rate-limited and timeout-bound.
- No credentials are logged or returned.
- Protected statuses short-circuit downstream data calls.
- Runtime failures degrade to `unavailable` with a concrete `nextAction`.
- Responses include provenance and confidence rather than silent fallbacks.

## Testing

Required checks before shipping:
- Unit tests for activation status classification.
- Connector/discovery tests for protected-source short-circuit behavior.
- Website bootstrap/source coverage tests for activation summary inclusion.
- Existing targeted tests: `test/source-coverage.spec.ts`, `test/website.service.spec.ts`, and connector tests.
- `npm run web:typecheck`.
- GitHub Flutter CI for mobile analyzer because Flutter is not installed in the local VM.

## Implementation order

1. Backend source activation types and service.
2. API endpoints and website bootstrap integration.
3. Municipal parcel workflow reads activation state.
4. Web source coverage panel updates.
5. Mobile gateway/source coverage model updates.
6. Tests and verification.
