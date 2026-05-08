# OpenAPI

The running NestJS service exposes Swagger UI and JSON at:

- `GET /docs`
- `GET /docs-json`

Initial endpoints:

- `GET /health`
- `GET /cache/status`
- `GET /sources`
- `POST /sources/discover`
- `POST /sources/discover/municipality`
- `GET /ingestion/capabilities`
- `GET /ingestion/requirements`
- `GET /ingestion/ai-gis-pipeline`
- `GET /municipalities`
- `GET /municipalities/:id/connectors`
- `POST /parcels/query`
- `POST /geo/intersections`
- `GET /plans/suspensions`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /connectors/:id/sync`
- `GET /search/status`
- `GET /search/indices`
- `GET /storage/status`
- `GET /storage/buckets`
- `GET /map/tiles/status`
- `GET /map/layers`
- `GET /map/providers`
- `GET /map/providers/styles`
- `GET /observability/status`
- `GET /observability/metrics`

The API intentionally returns explicit readiness/error states when real data has not been ingested. It does not synthesize parcel or zoning answers.
