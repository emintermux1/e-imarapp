# OpenAPI

The running FastAPI service exposes OpenAPI docs and JSON at:

- `GET /docs`
- `GET /openapi.json`

## Endpoints

### Health
- `GET /health`

### Sources
- `GET /sources`
- `POST /sources/discover`
- `POST /sources/discover/municipality`

### Municipalities
- `GET /municipalities` (registry-based)
- `GET /municipalities/db` (PostGIS-backed)
- `GET /municipalities/:id/connectors` (registry)
- `GET /municipalities/:id/connectors/db` (PostGIS-backed with OGC endpoints)

### Parcels
- `POST /parcels/query` (ada_parsel, coordinate, address, geojson, kml)

### Geo / Spatial Analysis
- `POST /geo/intersections`
- `GET /geo/point?lon=&lat=&srid=` (point-in-polygon)
- `GET /geo/buffer?lon=&lat=&radius=&srid=`
- `POST /geo/overlay` (zoning overlay)

### Plans
- `GET /plans/suspensions?limit=`
- `GET /plans/:planId/sheets`
- `GET /plans/:planId/notes`
- `GET /plans/parcel/:parcelId/history`

### Connectors
- `POST /connectors/:id/sync`
- `GET /connectors/netcad/strategy`
- `POST /connectors/:id/netcad/discover`
- `POST /connectors/:id/ogc/discover`
- `POST /connectors/ogc/discover-all`
- `GET /connectors/ogc/stale`

### Jobs
- `GET /jobs`
- `GET /jobs/:id`

### Ingestion
- `GET /ingestion/capabilities`
- `GET /ingestion/requirements`
- `GET /ingestion/readiness`
- `GET /ingestion/ai-gis-pipeline`

### Analysis / AI-GIS
- `GET /analysis/pipeline`
- `GET /analysis/runs?limit=`
- `GET /analysis/provenance/:parcelId`
- `POST /analysis/parcel-potential`
- `POST /analysis/plan-notes/explain`

### Reports
- `POST /reports/request`
- `GET /reports/:id`

### Simulation / Premium Spatial Tools
- `GET /simulation/building-envelope/:parcelId`
- `GET /simulation/merge-candidates/:parcelId`
- `POST /simulation/emsal-share/calculate`

### e-Plan Watchlist / Notification v1
- `POST /eplan/subscriptions`
- `GET /eplan/subscriptions?userReference=`
- `POST /eplan/notify`

### User Data
- `POST /users/history`
- `GET /users/:userReference/history`
- `POST /users/favorites`
- `GET /users/:userReference/favorites`

### Satellite / Drone Analysis Requests
- `GET /satellite/providers`
- `POST /satellite/analysis/request`

### Cache
- `GET /cache/status`

### Search
- `GET /search/status`
- `GET /search/indices`

### Storage
- `GET /storage/status`
- `GET /storage/buckets`

### Map
- `GET /map/tiles/status`
- `GET /map/layers`
- `GET /map/providers`
- `GET /map/providers/styles`

### Observability
- `GET /observability/status`
- `GET /observability/metrics`

### Website Backend (No UI BFF)
- `GET /website/architecture`
- `GET /website/bootstrap?userReference=`
- `POST /website/session/start`
- `POST /website/session/verify`
- `POST /website/bff/parcel-workflow`
- `POST /website/bff/plan-note-explain`
- `GET /website/workspace/:userReference`

The API intentionally returns explicit readiness/error states when real data has not been ingested. It does not synthesize parcel or zoning answers.
