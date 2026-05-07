# CAPTAIN.md

This repository is a Flutter 3.24+ mobile app for E-İmar (`apps/e_imar_mobile`) with a shared Dart package (`packages/e_imar_core`) and Firebase rules/config (`firebase`). Use Riverpod, GoRouter, Firebase Auth/Firestore/Storage/Messaging/Crashlytics/Remote Config, Mapbox, Isar, Syncfusion/pdf, and AI provider seams consistently with the existing architecture.

## Skills and MCP usage policy

Future agents should proactively use the repo-local skills in `.agents/skills` before related work:

- Frontend, mobile UI, product UX, Flutter screen polish, and visual review: read `frontend-design`, `ui-ux-pro-max`, and `web-design-guidelines` first. Treat web-specific guidance as design/reference material and adapt it to Flutter/Material patterns.
- Firebase, Auth, Firestore, Storage/security rules, Hosting, App Hosting, Data Connect, Crashlytics, Remote Config, or Firebase CLI work: read `firebase-basics` plus the matching Firebase skill before editing code or rules. Use `firebase-security-rules-auditor` whenever `firebase/*.rules` changes.
- Browser/manual QA, screenshots, web admin tooling, or interactive verification: read `agent-browser` and/or `webapp-testing` before running browser automation.
- AI image, video, marketing, app-store, or visual asset generation: read `ai-image-generation`, `ai-video-generation`, `infsh-cli`, and `agent-tools` as applicable.
- Adding or changing skills: read `skill-creator` first.
- Adding, changing, or recommending MCP servers/tools: read `mcp-builder` first, inspect available MCP servers/tools before calling them, and never put secrets in MCP config.
- CI/deploy/docs work: read `github-actions-docs`; use `deploy-to-vercel` only for secondary web previews or docs sites because E-İmar is Flutter/Firebase-first.
- Supabase/Postgres/Better Auth skills are reference-only unless the product explicitly adopts those systems; Firebase remains primary.

MCP usage expectations:

- Start by listing available MCP servers, then inspect a server's tools/schema before using any tool that needs inputs.
- Prefer MCPs for live external state when available: GitHub PR/issues/actions, Firebase/Google Cloud project state, browser/web testing, Firecrawl/web research, and Capy automations.
- Store credentials only in environment variables or the hosting platform's secret store. Do not commit tokens, service-account JSON, refresh tokens, or `.env` files.
- If a machine-readable MCP config is added later, keep it minimal, valid for the chosen client, and placeholder-only for secrets.

## Repo conventions

- Keep changes scoped to the requested phase/capability; do not introduce unrelated enterprise skills or unused infrastructure.
- Do not overwrite generated Firebase native config with real credentials. The checked-in FlutterFire stub is safe for local development.
- Run the most direct checks available before finishing. For app code, prefer `flutter analyze` and `flutter test` from `apps/e_imar_mobile` when Flutter is installed.
