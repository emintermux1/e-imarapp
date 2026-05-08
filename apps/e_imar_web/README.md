# E-İmar Web

Production website foundation for the e-imar platform. The app is a React + TypeScript + Vite frontend that talks to the existing NestJS website/BFF endpoints and renders backend readiness states instead of fabricating parcel, zoning, municipality, or map data.

## Environment

```bash
VITE_API_BASE_URL=http://localhost:3000
```

If `VITE_API_BASE_URL` is not set, development defaults to `http://localhost:3000`.

## Run

From the repository root:

```bash
npm install
npm install --prefix apps/e_imar_web
npm run start:dev
npm run web:dev
```

Build and validation:

```bash
npm run web:typecheck
npm run web:build
```

The root `npm run build` remains the backend TypeScript build. Use `npm run web:build` for this app.

## Data policy

- All domain data is rendered from `/website/*` or `/map/*` backend responses.
- `not_ready`, `empty`, `requires_credentials`, `unavailable`, `captcha_required`, and `rate_limited` states are displayed explicitly.
- The map canvas is a live-map placeholder until configured providers and vector tiles are available; it does not draw fake parcels.
