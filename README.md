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

### Web frontend startup (canonical Next.js app)

```bash
cd frontend
npm install
npm run dev
```

Web app runs at `http://localhost:3000` and connects to FastAPI via `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000/api/v1`).

`apps/web` is a deprecated Vite prototype. Its npm scripts are shims that start/build `frontend/` so agents and humans do not accidentally open the stale `localhost:5173` app.

### Legacy prototype frontends

Older experiments remain under `apps/` for historical reference only. Do not use `apps/web`, `apps/web-next`, `apps/e_imar_next`, or `apps/e_imar_web` as the product frontend unless explicitly working on legacy migration.

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

The code registry is in `src/sources/source-registry.ts`. It starts with official and municipal seed systems, including TKGM Parsel Sorgu and data-sharing rules, current/legacy E-Plan, TUCBS Public API and main portal, Atlas, ÇŞB CBS, Akıllı Şehirler local data platforms, BulutKBS, MAKS, Netcad references, municipal KEOS/WebGIS/eKent/KBS portals, OpenStreetMap, Esri World Imagery, Copernicus, Landsat, Mapbox, MapTiler, HERE, and Cesium ion. New municipal seeds include Süleymanpaşa, Mustafakemalpaşa, Gelibolu, Çaycuma, and Keçiören.

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

- `GET /sources/municipalities/:id/capability` where `:id` is a source id or `municipalitySlug`.
- `GET /sources/municipality-coverage?province=&district=&vendor=` for capability-enriched municipal coverage.
- `POST /sources/candidates/normalize` to preview a contributed source URL without writing to the registry.
- `POST /website/bff/municipal-parcel-workflow` for honest ada/parsel BFF status aggregation.
- `GET /connectors/netcad/strategy`
- `POST /connectors/:id/netcad/discover`
- `POST /connectors/:id/netcad/resolve-methods` for ASMX `?WSDL` and public HTML/JS payload hint discovery.
- `POST /connectors/:id/ogc/catalog` for WMS/WFS GetCapabilities layer catalog parsing.

The discovery step fetches public HTML and same-origin JS only, extracts `.ashx`, `.asmx`, `NetGIS`, WMS/WFS, ArcGIS, and GeoServer references, preserves published ports in candidate URLs, probes common KEOS endpoints, and reports the next connector step. Resolver/catalog responses mark public metadata separately from official data, include provenance, and only SHA-256 hash real response bodies. Protected flows return `protected`, `captcha_required`, `requires_credentials`, or `requires_legal_agreement` rather than bypassing access controls or fabricating data. See `docs/connectors/netcad-keos.md`.

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

If PostGIS or Redis is not configured, API endpoints return a `not_ready` or `unavailable` status with a concrete next action. They do not invent parcel or plan results. Municipal parcel workflows return `method_contract_required`, `protected`, `source_not_found`, or `not_ready` when registry, TKGM geometry, or Netcad/KEOS contracts are not verified; demo/derived/public metadata is never labeled as official data.

## Tests

```bash
npm test
npm run build
```

### Full repository verification

Runs root TypeScript + Jest, Python `compileall` on `app/`, the canonical `frontend/` typecheck and lint, and (non-blocking) legacy `apps/e_imar_web` typecheck when present:

```bash
npm run repo:health
```

## Architecture decisions

See `docs/adr/0001-backend-first-geospatial-foundation.md`.

## Website app and integration

The canonical product frontend is `frontend/` (Next.js 14 App Router). It consumes the FastAPI `/api/v1/*` endpoints and renders readiness/error states instead of inventing parcel, zoning, municipality, or map data.

- App README: `frontend/README.md`
- Architecture and runbook: `docs/website-architecture.md`
- Bootstrap/capabilities endpoint: `GET /website/bootstrap`
- Aggregated website workflow endpoint: `POST /website/bff/parcel-workflow`
- Municipal ada/parsel readiness workflow: `POST /website/bff/municipal-parcel-workflow`
- Plan note endpoint: `POST /website/bff/plan-note-explain`
- Workspace endpoint: `GET /website/workspace/:userReference`
- Session token endpoints: `POST /website/session/start`, `POST /website/session/verify`

Run the website locally:

```bash
npm install --prefix frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 npm run web:dev
npm run web:build
```

The root `npm run build` remains the backend build. Website-specific scripts are `web:dev`, `web:build`, `web:preview`, and `web:typecheck`, all pointing at `frontend/`.

Required website integration env:

```bash
WEBSITE_SESSION_SECRET=...
OPENAI_API_KEY=...          # for plan-note explain
PUSH_GATEWAY_URL=...        # for push channel delivery
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Design references for website-first rollout:

- `docs/site-design-phase-1.md`
- `docs/site-design-language.md`
- `docs/site-ui-implementation-backlog.md`
- `docs/ui-contract-homepage-wireframe.md`
- `docs/ui-contract-map-workspace-props.md`
- `docs/ui-state-machine-parcel-analysis.md`
- `docs/ui-ux-maps-full.md`
- `docs/frontend-task-pack-sprint-1.md`
