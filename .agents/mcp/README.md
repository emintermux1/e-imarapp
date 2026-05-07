# MCP recommendations for E-İmar

This repo does not currently include a machine-readable MCP client config. Keep MCP setup as documentation until a target client format is chosen, then add only valid, non-secret templates.

## Recommended servers

- **GitHub**: PRs, issues, Actions, releases, code search, and repository metadata.
  - Example env placeholders: `GITHUB_TOKEN`, `GITHUB_OWNER=emintermux1`, `GITHUB_REPO=e-imarapp`.
- **Firebase / Google Cloud**: Firebase project inspection, Firestore indexes/rules deployment checks, Hosting/App Hosting, Cloud Storage, Crashlytics, Remote Config, and IAM-safe project operations.
  - Example env placeholders: `GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json`, `FIREBASE_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`.
  - Never commit service-account JSON or downloaded Firebase app config containing production secrets.
- **Browser / web testing**: Playwright/browser automation for local admin tooling, web previews, screenshots, and manual QA evidence.
  - Example env placeholders: `BROWSER_BASE_URL=http://localhost:3000`, `PLAYWRIGHT_BROWSERS_PATH`.
- **Firecrawl / web research**: legally accessible zoning, municipality, e-Plan, TKGM documentation, public data catalog research, and source citation capture.
  - Example env placeholders: `FIRECRAWL_API_KEY`.
- **Supabase**: only if E-İmar later adopts Supabase/Postgres for relational data, analytics, or admin tooling. Firebase is the current primary backend.
  - Example env placeholders: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Capy automations**: use when available for task automation, scheduled checks, or Capy-native workflow integrations.

## Safe setup rules

1. Inspect available MCP servers and tool schemas before use.
2. Prefer read-only/scoped tokens for research and review tasks.
3. Put all credentials in environment variables or secret managers, never in repository files.
4. Use placeholder examples only in committed config/docs.
5. If adding a real MCP config later, include comments or docs explaining required environment variables and least-privilege scopes.
