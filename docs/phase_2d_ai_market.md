# Phase 2D: AI valuation and market intelligence

This phase adds mock-first scaffolding for parcel AI analysis, market valuation, ethical data ingestion, and a premium valuation preview panel. It intentionally avoids real model calls, secrets, routing changes, and generated files.

## AI guardrails

- AI output is advisory only. It must not be presented as a licensed appraisal, legal opinion, credit decision, or guaranteed sale value.
- Every price estimate must include a confidence interval, source notes, and risk caveats before it is shown to a user.
- GPT-4o/Grok providers should stay fail-soft: if a provider is unavailable, the app should return a mock or cached-safe response with a clear source note rather than blocking parcel workflows.
- Investment scores are ranking aids, not recommendations to buy or sell. The UI should keep caveats visible near the score.
- Model responses must be deterministic enough for audits: persist provider name, prompt version, input boundary summary, generated timestamp, citations, and confidence values when production persistence is added.

## Prompt and data boundaries

Allowed prompt inputs:

- User-selected parcel metadata: city, district, neighborhood, ada/parsel, area, zoning status, TAKS/KAKS/emsal, floor limits.
- Permitted market data from partner APIs, licensed datasets, municipality open data, or manual appraisal entries.
- Aggregated, non-identifying market statistics.

Disallowed prompt inputs:

- Secrets, API keys, session tokens, or internal credentials.
- Personal data not required for valuation, including owner identity or contact details.
- Data acquired through unauthorized scraping, platform ToS violations, bypassed bot protections, or copied private listings.
- Hidden chain-of-thought or raw internal model reasoning. Store concise explanation summaries only.

## Citation requirements

Production AI valuation responses should cite source notes for every material claim:

- Price estimate: at least one permitted market source plus confidence interval methodology note.
- Market comparable: source name, access mode, observed date, location granularity, and whether it is asking price, open data, or manual appraisal.
- Zoning claim: municipality/open data source or user-supplied parcel report reference.
- Risk caveat: source or rule that triggered the caveat, when available.

Citations should avoid exposing raw listing URLs unless the partner contract allows display. When display is not allowed, show a source badge and audit-safe note.

## Ethical ingestion plan

Supported source categories:

- Sahibinden: partner API or permitted dataset only.
- Emlakjet: partner API or permitted dataset only.
- Hepsiemlak: partner API or permitted dataset only.
- Municipality open data: official open datasets with license review.
- Manual appraisal: licensed appraiser or authorized internal entry.

The adapter architecture rejects unauthorized scraping by default. Each adapter should enforce:

- Access mode allowlist: partner API, permitted dataset, or manual entry.
- Rate-limit placeholders: per-minute, per-day, and burst controls.
- Audit trail: actor, purpose, source, access mode, timestamp, consent reference.
- Consent/license metadata: grantor, allowed purpose, expiry, and dataset terms.

Next production step is to implement source-specific adapters behind contract reviews, not browser scraping jobs.

## KVKK considerations

- Use data minimization: valuation does not need owner names, phone numbers, national IDs, or private notes.
- Define lawful basis and purpose limitation for any personal data that appears in manual appraisal records.
- Keep user consent and dataset license records linked to audit trails.
- Apply retention limits to prompt logs and source snapshots; keep aggregated valuation metrics where possible.
- Provide deletion/export paths for user-submitted appraisal notes when tied to an identifiable account.
- Do not send personal data to AI providers unless a data processing agreement, retention policy, and user notice are in place.

## Next integration steps

1. Add production provider classes for GPT-4o and Grok behind server-managed API keys; the mobile app should not store model secrets.
2. Add a valuation repository that persists request/response metadata, citations, and audit trails.
3. Connect parcel detail and premium flows to `ValuationPreviewPanel` after router/home-map ownership is clear.
4. Replace mock comparable data with licensed adapters and contract-specific display rules.
5. Add tests for fail-soft provider fallback, unauthorized scraping rejection, confidence interval formatting, and source badge rendering.
6. Review final UI copy with legal/compliance before labeling scores as investment guidance.
