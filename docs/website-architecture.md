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

## Security notes

- Use HTTPS and terminate TLS at Cloudflare/NGINX/Ingress.
- Keep secrets in secret manager (never in git).
- Add API gateway rate limiting for website BFF endpoints.
- If OAuth/login is introduced later, keep website tokens short-lived and rotate secrets.

## Production deployment pattern

- Web app server -> API gateway -> FastAPI API
- Redis + BullMQ for async tasks
- PostgreSQL/PostGIS for geospatial state
- MinIO/S3 for artifacts
- OpenSearch for indexing/search

No fake datasets should be introduced in this layer; all unavailable integrations must return explicit readiness states.
