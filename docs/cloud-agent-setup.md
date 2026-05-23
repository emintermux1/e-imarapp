# Cursor Cloud Agent setup

Use this repository setup command for future Cursor cloud agents:

```bash
npm run cloud:setup
```

The script performs these steps:

1. Verifies Node.js and npm availability.
2. Installs dependencies with `npm ci` when `package-lock.json` exists.
3. Creates `.env` from `.env.example` if needed.
4. Starts Docker Compose services when Docker is available:
   - PostgreSQL/PostGIS
   - Redis
   - MinIO
   - OpenSearch
   - pg_tileserv
   - Prometheus
   - Grafana
5. Runs `npm run typecheck` and `npm test`.

If Docker is not available in the agent runtime, the script leaves a clear message and the API still returns explicit `not_ready` states instead of fake data.

Recommended Cursor environment prompt:

```text
For this repository, run npm run cloud:setup at agent startup. Ensure Node.js, npm, Docker, Docker Compose, PostgreSQL/PostGIS, Redis, MinIO, and OpenSearch service images are available to agents.
```
