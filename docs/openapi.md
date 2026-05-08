# OpenAPI

The running NestJS service exposes Swagger UI and JSON at:

- `GET /docs`
- `GET /docs-json`

Initial endpoints:

- `GET /health`
- `GET /sources`
- `POST /sources/discover`
- `GET /municipalities`
- `GET /municipalities/:id/connectors`
- `POST /parcels/query`
- `POST /geo/intersections`
- `GET /plans/suspensions`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /connectors/:id/sync`

The API intentionally returns explicit readiness/error states when real data has not been ingested. It does not synthesize parcel or zoning answers.
