# @e-imar/next

Production-grade Next.js 14 frontend for the Türkiye e-İmar / GIS platform.

This is **Sprint 1** of 3: shell, design system, map workspace, parcel search,
parcel detail accordion, readiness states, and stubs for Sprint 2/3 modules
(askı haritası, watchlist, time machine, raporlar, ayarlar).

## Quickstart

```bash
cd apps/e_imar_next
npm install
cp .env.example .env
npm run dev
```

The dev server runs at <http://localhost:3010>. The Nest.js BFF backend must
be running at the URL configured by `NEXT_PUBLIC_API_BASE_URL` (defaults to
`http://localhost:3000`).

### Useful scripts

| script              | what it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Next dev server on port 3010          |
| `npm run build`     | Production build                      |
| `npm run start`     | Run the production build              |
| `npm run typecheck` | `tsc --noEmit` strict typecheck       |
| `npm run lint`      | `next lint` (ESLint + core-web-vitals) |

You can also run from the repo root:

```bash
npm run next:dev
npm run next:build
npm run next:typecheck
```

## Folder map

```
apps/e_imar_next/
├── public/                    # static assets (empty for Sprint 1)
└── src/
    ├── app/
    │   ├── layout.tsx         # root html, fonts, providers
    │   ├── providers.tsx      # ThemeProvider + QueryClient
    │   ├── globals.css        # design tokens (light/dark vars)
    │   ├── loading.tsx        # route-level skeleton
    │   ├── error.tsx          # client error boundary
    │   ├── not-found.tsx
    │   ├── page.tsx           # "/"  workspace
    │   ├── parcel/[id]/       # focused parcel workspace
    │   ├── watchlist/         # Sprint 2 stub
    │   ├── aski-haritasi/     # Sprint 2 stub
    │   ├── time-machine/      # Sprint 3 stub
    │   ├── reports/           # Sprint 2 stub
    │   └── settings/          # Sprint 2 stub
    ├── components/
    │   ├── shell/             # AppShell, top bar, sidebars, bottom sheet
    │   ├── map/               # MapLibre viewport, controls, layer catalog, legend
    │   ├── parcel/            # search form, detail accordion, fact cards
    │   ├── data/              # readiness gate, status badge, banners, skeletons
    │   └── ui/                # Button, IconButton, Tabs, Accordion, Tooltip, Input, Select, Textarea
    ├── lib/
    │   ├── api/               # typed client + endpoint helpers (ported from apps/e_imar_web)
    │   ├── query/             # TanStack hooks + key factory + server prefetch helper
    │   ├── store/             # Zustand stores (map, ui, search)
    │   ├── map/               # styles + layer-defs
    │   ├── utils/             # cn, formatters, parcel adapters, readiness mapping
    │   └── analytics/         # typed `trackEvent` (console-based for now)
    └── types/                 # ReadinessState, LayerCatalogItem, MapStyleName
```

## Stack

- **Next.js 14 App Router** with strict TypeScript
- **Tailwind CSS** with tokenized CSS vars + `next-themes` for light/dark
- **TanStack Query v5** for server state (with server-side prefetch + hydration)
- **Zustand** for UI/local state (map, ui, search)
- **maplibre-gl** for the 2D map (dynamic-imported to avoid SSR issues)
- **framer-motion** for accordion / drawer / sheet animations (respects
  `prefers-reduced-motion`)
- **react-hook-form** + **zod** for parcel search forms
- **lucide-react** for icons
- Inter (body) + IBM Plex Sans (data labels) via `next/font/google`

## Backend integration

All requests go through the BFF endpoints documented in
`docs/website-architecture.md`:

| endpoint                              | purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `GET /website/bootstrap`              | product readiness + map provider/tile state |
| `POST /website/bff/parcel-workflow`   | parcel query + potential summary + emsal   |
| `POST /website/bff/plan-note-explain` | LLM-backed plan note explanation           |
| `GET  /website/workspace/:userRef`    | history / favorites / subscriptions        |
| `GET  /map/providers`                 | map provider readiness                     |

Configure the backend URL via `NEXT_PUBLIC_API_BASE_URL`. `next.config.mjs`
also rewrites `/api/website/*` and `/api/map/*` to the same upstream so
client-side calls can use either path.

## No-mock invariants

This app **does not** synthesize parcel/zoning values. When the backend
returns any non-`ok` status (`empty`, `not_ready`, `requires_credentials`,
`unavailable`, `rate_limited`, `provider_error`, etc.) the UI renders that
state explicitly via `ReadinessGate` / `StatusBanner` — including any
`nextActions` the backend chose to surface.

In particular:

- We never compute `emsal`, `taks`, `kaks`, or area totals on the client.
- We never render persisted/local stale parcel detail as if it were fresh.
- We never display a synthesized geometry; missing geometry shows an empty
  state with the backend's readiness status.

## What's NOT in Sprint 1

- Watchlist real CRUD (only the stub at `/watchlist`)
- Askı haritası real implementation (only the stub at `/aski-haritasi`)
- Time machine timeline + diff (only the stub at `/time-machine`)
- Cesium 3D viewer (only the toggle button + Sprint 3 banner)
- PDF/CSV report generation
- Notification rules builder
- Plan-explain page hardening
