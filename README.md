# Türkiye E-İmar Platform Backend Foundation

This repository contains the first backend-first foundation for a production-oriented Turkey e-imar, parcel, zoning, and municipal GIS platform.

## Principles

- No mock parcel, zoning, plan, or municipality data.
- Real source metadata only.
- Protected systems are reported as `requires_credentials`, `captcha_required`, `requires_legal_agreement`, or `unavailable`.
- PostGIS is the canonical spatial store.
- New municipal connectors should be added through source metadata and connector plugins, not hard-coded endpoint logic.

## Stack

- Node.js, TypeScript, NestJS, Fastify
- PostgreSQL/PostGIS
- Redis + BullMQ-compatible job orchestration
- MinIO for object storage
- OpenSearch for search indexing
- Swagger/OpenAPI
- pg_tileserv-compatible vector tile serving
- Prometheus/Grafana observability

## Local startup

```bash
npm install
docker compose up -d
cp .env.example .env
npm run start:dev
```

Swagger UI is available at `http://localhost:3000/docs`.

Docker Compose now includes the API service as well as PostGIS, Redis, MinIO, OpenSearch, pg_tileserv, Prometheus, and Grafana.

## Cursor cloud agent startup

Future agents can run the repository bootstrap command:

```bash
npm run cloud:setup
```

It installs locked npm dependencies, creates `.env` when missing, starts Docker Compose data services when Docker is available, and runs typecheck/tests. See `docs/cloud-agent-setup.md`.

## Database

Migrations live in `database/migrations` and are mounted into the PostGIS container for first initialization.

The initial schema includes:

- `data_sources`
- `municipalities`
- `connectors`
- `parcels`
- `plans`
- `zoning_layers`
- `plan_sheets`
- `plan_notes`
- `suspension_notices`
- `parcel_zoning_snapshots`
- `connector_runs`

Spatial indexes are created for municipal boundaries, parcels, plans, and zoning layers.

## Real source registry

The code registry is in `src/sources/source-registry.ts`. It starts with official and municipal seed systems, including TKGM, E-Plan, TUCBS, MAKS, e-Devlet/TUCBS, ÇŞİDB CBS, İçişleri e-Belediye, HGM Atlas, İBB Açık Veri, Netcad/KEOS reference patterns, municipal imar/CBS portals, OpenStreetMap, Esri World Imagery, Copernicus, Landsat, Mapbox, MapTiler, HERE, and Cesium ion.

Discovery probes live endpoints and returns explicit status instead of assuming that a URL is usable.

## Credentials and approvals that are still required for live ingestion

These are intentionally not hard-coded:

- TKGM: legal data-sharing compliance plus possible browser session/captcha handling.
- MAKS: legal/institutional approval and institutional credentials.
- e-Devlet/TUCBS: legal e-Devlet authentication workflow.
- İçişleri e-Belediye: institutional login.
- Copernicus Data Space: official account/OAuth configuration.
- Mapbox: `MAPBOX_ACCESS_TOKEN`.
- MapTiler: `MAPTILER_API_KEY`.
- HERE: `HERE_API_KEY`.
- Cesium ion: `CESIUM_ION_TOKEN`.
- Individual municipal portals may require captcha/session/cookie persistence; discovery reports this as `captcha_required` or `requires_credentials`.

The API exposes `GET /ingestion/requirements` to list sources that cannot be ingested without credentials, legal approval, or commercial tokens.

## Netcad / KEOS data pull

For public KEOS portals without login/bot protection, data is pulled by discovering the backend service endpoints used by the page, not by inventing responses. Use:

- `GET /connectors/netcad/strategy`
- `POST /connectors/:id/netcad/discover`

The discovery step fetches HTML/JS, extracts `.ashx`, `.asmx`, `NetGIS`, WMS/WFS, ArcGIS, and GeoServer references, probes common KEOS endpoints, and reports the next connector step. See `docs/connectors/netcad-keos.md`.

Map provider keys and OpenAI credentials should be provided through environment variables or a secret manager, never committed:

```bash
MAPTILER_API_KEY=...
MAPBOX_ACCESS_TOKEN=...
CESIUM_ION_TOKEN=...
HERE_API_KEY=...
OPENAI_API_KEY=...
```

Use `GET /map/providers` or `GET /map/providers/health` to confirm whether each provider key is configured or malformed. These endpoints return configuration diagnostics only and never return secret values.

Local check:

```bash
npm run map:check-keys
```

If you want to use local `.env`, copy `.env.example` to `.env` and fill the optional provider variables there. `.env` is gitignored. Startup now validates malformed URLs, ports, and placeholder secret values before the app begins serving traffic.

## API behavior

If PostGIS or Redis is not configured, API endpoints return a `not_ready` or `unavailable` status with a concrete next action. They do not invent parcel or plan results.

## Tests

```bash
npm test
npm run build
```

## Architecture decisions

See `docs/adr/0001-backend-first-geospatial-foundation.md`.

## Website app and integration

The repository includes a website integration layer (`/website/*`) plus the first production web app at `apps/e_imar_web`. The frontend is React + TypeScript + Vite, consumes the existing BFF endpoints, and renders readiness/error states instead of inventing parcel, zoning, municipality, or map data.

- App README: `apps/e_imar_web/README.md`
- Architecture and runbook: `docs/website-architecture.md`
- Bootstrap/capabilities endpoint: `GET /website/bootstrap`
- Aggregated website workflow endpoint: `POST /website/bff/parcel-workflow`
- Plan note endpoint: `POST /website/bff/plan-note-explain`
- Workspace endpoint: `GET /website/workspace/:userReference`
- Session token endpoints: `POST /website/session/start`, `POST /website/session/verify`

Run the website locally:

```bash
npm install --prefix apps/e_imar_web
VITE_API_BASE_URL=http://localhost:3000 npm run web:dev
npm run web:build
```

The root `npm run build` remains the backend build. Website-specific scripts are `web:dev`, `web:build`, `web:preview`, and `web:typecheck`.

Required website integration env:

```bash
WEBSITE_SESSION_SECRET=...
OPENAI_API_KEY=...          # for plan-note explain
PUSH_GATEWAY_URL=...        # for push channel delivery
VITE_API_BASE_URL=http://localhost:3000
```

Design references for website-first rollout:

- `docs/site-design-phase-1.md`
- `docs/site-design-language.md`
- `docs/site-ui-implementation-backlog.md`
