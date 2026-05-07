# E-İmar agent skills catalog

Curated skills are stored under `.agents/skills/<skill-name>/SKILL.md`. They are intentionally focused on Flutter/mobile product work, Firebase, safe MCP/tooling, AI media assets, and CI/deploy support.

## Flutter, mobile UI, product design, and QA

| Skill | Source | How it helps E-İmar |
| --- | --- | --- |
| `frontend-design` | `anthropics/skills` | Production-grade frontend design heuristics for premium map-first screens, dashboards, and polished flows. |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Accessibility, layout, and UI review checklist; adapt web guidance to Flutter widgets and Material semantics. |
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` | Broad UI/UX style, palette, typography, product-type, and Flutter-aware design reference. |
| `webapp-testing` | `anthropics/skills` | Playwright/browser verification for web previews, admin panels, and local tooling. |
| `agent-browser` | `inference-skills/skills` | Browser automation reference for screenshots, navigation, forms, scraping, and manual QA workflows. |

## Firebase and backend data

| Skill | Source | How it helps E-İmar |
| --- | --- | --- |
| `firebase-basics` | `firebase/agent-skills` | Firebase CLI/project setup, active project selection, and safe app config workflows. |
| `firebase-auth-basics` | `firebase/agent-skills` | Firebase Auth setup and auth-aware data access guidance for sign-in/profile work. |
| `firebase-firestore` | `firebase/agent-skills` | Firestore data modeling, queries, indexes, and client SDK usage; use before any Firestore work. |
| `firebase-security-rules-auditor` | `firebase/agent-skills` | Security review checklist for `firebase/firestore.rules` and other Firestore rules changes. |
| `firebase-hosting-basics` | `firebase/agent-skills` | Firebase Hosting reference for static web/admin artifacts when needed. |
| `firebase-app-hosting-basics` | `firebase/agent-skills` | Firebase App Hosting reference for future web backends; secondary to the Flutter app. |
| `firebase-data-connect` | `firebase/agent-skills` | Relational PostgreSQL/Data Connect reference if E-İmar later needs SQL-backed workflows. |
| `supabase` | `supabase/agent-skills` | Reference-only unless Supabase is adopted; useful for comparing Auth/Storage/Realtime/RLS patterns. |
| `supabase-postgres-best-practices` | `supabase/agent-skills` | PostgreSQL schema/query performance reference for future relational data or Data Connect design. |
| `better-auth-best-practices` | `better-auth/skills` | Reference-only TypeScript auth patterns; Firebase Auth remains primary. |

## Agent tooling, MCP, and AI media

| Skill | Source | How it helps E-İmar |
| --- | --- | --- |
| `skill-creator` | `anthropics/skills` | Guidance for creating or improving repo-local skills. |
| `mcp-builder` | `anthropics/skills` | High-quality MCP server design guidance before adding/changing MCP integrations. |
| `agent-tools` | `inference-skills/skills` | Inference.sh tool catalog for AI apps, web search, LLMs, and automation references. |
| `infsh-cli` | `inference-skills/skills` | CLI reference for running inference.sh apps safely. |
| `ai-image-generation` | `inference-sh/skills` (pre-existing) | Existing image-generation skill for app-store, marketing, and product mockup assets. |
| `ai-video-generation` | `inference-skills/skills` | Video generation reference for demos, ads, explainer clips, or social assets. |

## CI, deployment, and docs

| Skill | Source | How it helps E-İmar |
| --- | --- | --- |
| `github-actions-docs` | `xixu-me/skills` | Docs-grounded GitHub Actions workflow syntax, security, caching, matrix, and OIDC guidance. |
| `deploy-to-vercel` | `vercel-labs/agent-skills` | Secondary deployment reference for docs/admin web previews; E-İmar remains Flutter/Firebase-first. |
