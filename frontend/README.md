# eImarTR Frontend

Canonical product frontend for eImarTR. This is a Next.js 14 App Router app under `frontend/`.

Do not run the deprecated Vite prototype under `apps/web` for product work. If `apps/web` is started by mistake, its scripts now delegate back to this app.

## Development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The frontend talks to FastAPI through `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:8000/api/v1`.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 npm run dev
```

## Checks

```bash
npm run typecheck
npm run build
npm run lint
```
