# Website Backend Architecture (No UI)

This document defines how to connect a web frontend (Next.js, Nuxt, React SPA, mobile web, etc.) to the current backend without implementing UI code in this repository.

## Goals

- Keep domain logic in core modules (`parcels`, `analysis`, `simulation`, `eplan`, `geo`, `plans`).
- Expose website-friendly aggregation endpoints through a BFF layer.
- Keep no-mock and real-source principles intact.
- Provide signed session token flow for website/API gateway integration.

## Module layout

- `src/website/website.module.ts`
- `src/website/website.controller.ts`
- `src/website/website.service.ts`

The website module orchestrates existing services; it does not duplicate geospatial business logic.

## Request flow

1. Browser hits your website app.
2. Website server (or API gateway) calls `/website/bootstrap`.
3. User actions call BFF endpoints:
   - `/website/bff/parcel-workflow`
   - `/website/bff/plan-note-explain`
4. Domain services execute and return normalized responses.
5. History/favorites/subscriptions can be fetched via `/website/workspace/:userReference`.

## Endpoints

### Architecture & bootstrap

- `GET /website/architecture`
- `GET /website/bootstrap?userReference=<id>`
- Web app deployment probes: `GET /healthz` and `GET /readyz`

### Session

- `POST /website/session/start`
- `POST /website/session/verify`

Session tokens are HMAC-signed with `WEBSITE_SESSION_SECRET`.

### Website BFF

- `POST /website/bff/parcel-workflow`
  - Runs parcel query + potential summary + optional emsal/share calculation in one call.
- `POST /website/bff/plan-note-explain`
  - LLM-backed plain-language explanation.

### Workspace aggregation

- `GET /website/workspace/:userReference`
  - Aggregates query history, favorites, and notification subscriptions.

## Environment variables

- `WEBSITE_SESSION_SECRET` (required for session token issue/verify)
- `OPENAI_API_KEY` (required for plan-note explain endpoint)
- `PUSH_GATEWAY_URL` (required for live push dispatch from notification pipeline)
- `NEXT_PUBLIC_EIMAR_SITE_URL` (canonical public website URL for metadata, sitemap, robots, manifest and OpenGraph)
- `NEXT_PUBLIC_EIMAR_API_BASE_URL` (canonical website backend origin for BFF, connector and `/api/v1/*` rewrite traffic)
- `NEXT_PUBLIC_API_BASE_URL` (accepted API-v1-specific alias, e.g. `https://api.example.com/api/v1`; used first when both variables are present for backward compatibility)
- `NEXT_PUBLIC_EIMAR_DATA_MODE=api|vector-tile`
- `NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL` (required when `NEXT_PUBLIC_EIMAR_DATA_MODE=vector-tile`)
- `NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK=0` in production

## Security notes

- Use HTTPS and terminate TLS at Cloudflare/NGINX/Ingress.
- Keep secrets in secret manager (never in git).
- Add API gateway rate limiting for website BFF endpoints.
- The canonical web app sends browser hardening headers from `next.config.mjs` and exposes `/readyz` as a deploy gate for live source configuration.
- If OAuth/login is introduced later, keep website tokens short-lived and rotate secrets.

## Production deployment pattern

- Web app server -> API gateway -> NestJS API
- Redis + BullMQ for async tasks
- PostgreSQL/PostGIS for geospatial state
- MinIO/S3 for artifacts
- OpenSearch for indexing/search

No fake datasets should be introduced in this layer; all unavailable integrations must return explicit readiness states.
