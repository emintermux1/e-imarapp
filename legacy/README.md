# Legacy workspaces

These directories are historical prototypes, not product entry points:

- `legacy/apps/frontend`
- `legacy/apps/web`
- `legacy/apps/web-next`
- `legacy/apps/e_imar_next`
- `legacy/apps/e_imar_mobile`

The only canonical product UI is `apps/e_imar_web`. Root `web:*` scripts,
repository health checks, deploy probes, and production guardrails target that
app only. Touch legacy code only when explicitly migrating behavior into the
canonical web app.
