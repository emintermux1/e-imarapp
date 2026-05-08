# Deprecated Vite prototype

`apps/web` is no longer the product frontend. The canonical app is `frontend/` (Next.js 14) and runs on `http://localhost:3000`.

The scripts in this package intentionally delegate to `../../frontend` so that accidentally running this directory does not start the stale Vite app on `localhost:5173`.

Use:

```bash
cd ../../frontend
npm install
npm run dev
```

Or from repo root:

```bash
npm run web:dev
```
