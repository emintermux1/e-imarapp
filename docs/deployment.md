# Deployment

## Canonical production surface

The only current production web surface in this repository is the Next.js app in
`apps/e_imar_web`. The repository-root `web:*` scripts and `vercel.json` target
that app. Legacy web workspaces under `legacy/` and any old `apps/web*`,
`apps/e_imar_next`, or `frontend` references are prototypes/reference code unless
a task explicitly migrates them.

Do not claim `e-imarapp.vercel.app` or any custom domain is live from repository
configuration alone. Treat a public URL as verified only after confirming:

```bash
curl -fsS https://<domain>/healthz
curl -i https://<domain>/readyz
```

`/healthz` confirms the deployed web shell is reachable. `/readyz` is a stricter
production gate and returns 503 when live parcel data is not configured or demo
fallback is enabled.

## Vercel path

The versioned Vercel configuration is `vercel.json` at the repository root:

- Git deployments are enabled (`github.enabled: true`). A previous disabled value
  would prevent Vercel for Git from producing deployments and can leave
  `e-imarapp.vercel.app` returning 404 even though the code builds locally.
- Install command: `npm ci --prefix apps/e_imar_web`.
- Build command: `cd apps/e_imar_web && npm run build`.
- Output directory: `apps/e_imar_web/.next`.
- Framework: `nextjs`.

If the Vercel dashboard has a Root Directory/project setting, it must match this
versioned config. Either leave the project at repository root so `vercel.json` is
used, or explicitly point the Vercel project at `apps/e_imar_web` and mirror the
same environment variables. Do not point the project at a legacy app.

## Required production web environment

Production must set one real parcel source path and keep demo fallback disabled:

```bash
NEXT_PUBLIC_EIMAR_SITE_URL=https://<canonical-domain>
NEXT_PUBLIC_EIMAR_DATA_MODE=api
NEXT_PUBLIC_EIMAR_API_BASE_URL=https://<api-origin>
NEXT_PUBLIC_API_BASE_URL=https://<api-origin>/api/v1
NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK=0

# or, for vector tiles
NEXT_PUBLIC_EIMAR_DATA_MODE=vector-tile
NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL=https://<tile-origin>/public.parcels/{z}/{x}/{y}.pbf
NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK=0
```

Optional map/provider keys belong in the deploy target or secret manager, never
in git.

## Production data behavior

When live public sources, API, vector tiles, credentials, or legal approvals are
unavailable, the product must render explicit readiness/provenance states instead
of fabricating parcel, zoning, plan, or municipality data.

Allowed non-live states include `public_metadata`, `fallback`, `protected`,
`source_not_found`, `not_ready`, and `unavailable`. These states may show source
metadata, discovery status, cached provider records, or next actions, but they are
not official TKGM/municipal facts and must not be described as live production data.

Development and test environments may use labelled fixture/demo paths for UI
checks. Production should keep `NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK=0`; if no
live source is configured, the map shell remains available and parcel layers show
unavailable/readiness messaging.

## Flutter/mobile status

The Flutter app is currently under `legacy/apps/e_imar_mobile`. It is a
compile-checked prototype with a legacy CI workflow, not the production mobile
surface and not a store/release deployment pipeline. The current product deploy
path is web-first through `apps/e_imar_web`; mobile should be described as a
legacy/prototype gap until a new mobile release target is defined and verified.
