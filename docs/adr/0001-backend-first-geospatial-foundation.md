# ADR 0001: Backend-first geospatial foundation

## Status

Accepted.

## Context

The platform must support Turkey-wide e-imar workflows without fabricating parcel or zoning data. Official and municipal systems vary by provider, protocol, authentication model, and legal access constraints.

## Decision

The first implementation is a backend-first NestJS service with:

- a real-source registry for national, municipal, basemap, and open data systems;
- connector discovery that probes live endpoints and records explicit access/error states;
- PostGIS as the canonical spatial store;
- BullMQ-compatible ingestion orchestration;
- REST endpoints documented through Swagger/OpenAPI;
- Docker Compose for local PostgreSQL/PostGIS, Redis, MinIO, and OpenSearch.

The API may return `not_ready`, `requires_credentials`, or `unavailable` when real source data has not been ingested. It must not return fake parcel, plan, or zoning results.

## Consequences

- Early API consumers can integrate against stable contracts before all connectors are complete.
- Data ingestion work can be added incrementally per verified source.
- Protected systems remain explicit operational tasks rather than hidden mock integrations.
