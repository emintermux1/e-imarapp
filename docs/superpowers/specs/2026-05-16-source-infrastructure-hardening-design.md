# Source infrastructure hardening design

## Goal

Make source and map-provider activation understandable in local development and production without leaking tokens, fabricating protected government data, or crashing the web UI when backend payloads are still mixed between legacy and normalized shapes.

## Scope

This is a small hardening slice on top of the existing government source activation work.

In scope:
- Add explicit readiness metadata for source credentials, legal references, and map provider tokens.
- Keep every readiness response secret-safe: env names and configured/missing status only, never values.
- Make source activation records carry the same preflight requirement metadata used by ingestion readiness.
- Document the new readiness endpoint in the API docs.
- Normalize `/kaynaklar` source payloads on the web client so legacy arrays, direct envelopes, nested envelopes, and fallback fixtures all render through one shape.
- Reduce selected-point map panel overlap by making the panel shorter, more opaque, scrollable, and by hiding competing right-side HUD chips while a free-point analysis is open.

Out of scope:
- Storing real credentials or agreement documents in the repo.
- Browser/session automation for TKGM, MAKS, e-Devlet, captcha, or login-gated flows.
- Changing the public contract of existing successful source responses beyond additive metadata.
- Reworking the full map layout or redesigning unrelated panels.

## Architecture

### Source requirement evaluation

Add `src/sources/source-requirements.ts` as the canonical source-readiness classifier.

Each source gets:
- `requiredEnv`
- `missingEnv`
- `configuredEnv`
- `legalRequirement`
- `credentialRequirement`
- `preflightStatus`
- `canAttemptLiveProbe`
- `canStartIngestion`
- `operatorAction`
- `productionUse`
- per-env diagnostic metadata from `inspectOptionalSecret`

Explicit source IDs such as TKGM, MAKS, e-Devlet/TUCBS, Copernicus, Mapbox, MapTiler, HERE, and Cesium get hand-written requirements. Generic protected sources derive safe `*_LEGAL_REF` or `*_CREDENTIALS_REF` names from the source ID. Public metadata and public connector candidates remain probeable only as metadata/method-contract discovery until they prove callable.

### Backend API surface

Extend:
- `GET /ingestion/requirements` with the richer requirement metadata.
- `GET /ingestion/readiness` with all source readiness rows, rollups, blockers, and map-provider diagnostics.
- `GET /map/providers/readiness` as an alias to existing map-provider diagnostics.
- Source activation records with a `requirement` object.

Responses must include only env names/statuses. Values, token prefixes, sessions, and user-supplied secrets never appear.

### Web source normalization

`apps/e_imar_web/src/lib/api/eimar.ts` normalizes all known source payload variants before React components read them:
- raw arrays from legacy FastAPI `/sources`
- direct envelopes containing `sources`
- nested envelopes containing `data.sources`, `data.items`, or `data.results`
- health rows with probe fields merged into source rows
- legacy detail objects with `homepage_url`, `candidate_endpoints`, `requires_credentials`, or `requires_approval`

If a payload cannot produce at least one valid source row, the existing generated fixture remains the fallback. The `/kaynaklar` page must only receive `SourcesResponse.sources` as an array, removing the `sources.filter` crash path.

### Selected-point panel layout

The selected free-point analysis panel keeps the existing content, but changes presentation:
- cap height to the viewport and keep inner scroll
- use a solid surface and stronger border/ring for readability over map tiles
- reduce header/icon/body padding
- clamp long subtitle/detail text in compact mode
- show fewer bullets in compact cards
- hide provider badge and right HUD controls on non-2XL screens while free-point analysis is open

This keeps map interactions intact while preventing multiple right-side overlays from fighting for the same pixels.

## Error handling and safety

- Missing or malformed backend source payloads degrade to generated fixtures.
- Successful-but-legacy backend responses normalize instead of passing untrusted shapes to React.
- Unknown detail payloads fail gracefully or use fixture detail if available.
- Env diagnostics treat values as booleans/status only.
- Public map client env examples stay empty; no real token text is committed.

## Testing

Required checks:
- `npm --prefix apps/e_imar_web run typecheck`
- `npm --prefix apps/e_imar_web run lint`
- `NEXT_TELEMETRY_DISABLED=1 npm --prefix apps/e_imar_web run build`
- Browser/HTTP smoke for `/kaynaklar` against a legacy source array fixture returning one row.

Optional when the local browser is stable:
- Click an empty map area and confirm `aside[aria-label="Seçili nokta analizi paneli"]` opens without page errors.

## Implementation order

1. Add source requirement definitions and env name lists.
2. Wire readiness metadata into ingestion, map provider, and source activation services.
3. Add web source response normalization.
4. Tighten selected-point panel and right-side overlay behavior.
5. Run typecheck, lint, production build, and `/kaynaklar` smoke.
