# eImarTR Frontend

Legacy/reference frontend for eImarTR. The canonical product frontend is `apps/e_imar_web`.

Do not use this app for product work unless explicitly migrating functionality into `apps/e_imar_web`.

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
