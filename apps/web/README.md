# Deprecated Vite prototype

`apps/web` is no longer the product frontend. The canonical product app is `apps/e_imar_web` (Next.js 14) and runs on `http://localhost:3000`.

Do not use this Vite prototype for product work. Root `web:*` scripts point to `apps/e_imar_web` so agents and humans do not accidentally open the stale `localhost:5173` app.

Use:

```bash
cd ../e_imar_web
npm install
npm run dev
```

Or from repo root:

```bash
npm run web:dev
```
