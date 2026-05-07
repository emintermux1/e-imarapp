# Phase 2C Premium PDF Reports

Phase 2C adds a pure, testable PDF generation scaffold for premium parcel reports. The service lives in `apps/e_imar_mobile/lib/src/core/services/pdf_report_service.dart`, returns `Uint8List`, and does not depend on platform share/export APIs.

## Report template

The current template uses the existing `pdf` package and keeps the optional Syncfusion probe compile-safe for later template experiments. The generated Turkish PDF includes:

- `E-İmar` branded header with `İmar ve Emsal Sorgu` subtitle.
- Parcel and location summary: city, district, neighborhood, ada/parsel, title type, zoning status, optional address and coordinates.
- Zoning metrics table: TAKS, KAKS, Emsal, kat sınırı, yol cephesi, optional yapılaşma/plan function values.
- Map snapshot placeholder, with optional bytes field ready for a later Mapbox/GIS capture.
- Risk summary with named risk items, normalized risk levels, and explanatory notes.
- AI insights with title, message, and optional confidence values.
- Valuation assumptions covering investment score, market trend, project potential, and comparable-data limitations.
- QR/reference placeholder for future authenticated report links.
- KVKK/legal disclaimer and mock-data watermark while live integrations are absent.

## Data requirements

`ParcelReportData` is the canonical input model:

- `ParcelIdentity`: parcel identity and location fields.
- `ZoningMetrics`: planning metrics shown in the metrics table.
- `RiskSummary`: overall label plus risk items.
- `AiInsight`: user-facing AI summary cards.
- `ValuationAssumptions`: investment score and assumptions behind valuation commentary.
- `generatedAt`: report timestamp.
- `disclaimer`: legal/KVKK text.
- `referenceCode`: optional verification/reference string.
- `mapSnapshotBytes`: optional image bytes for future map snapshot rendering.
- `usesMockData`: controls mock-data watermark.

The legacy `ParcelReportService.generateParcelReport(parcelTitle, metrics)` interface remains available as an adapter so existing callers can pass simple maps while tests and future premium flows can call `generatePremiumParcelReport(ParcelReportData)` directly.

## Future share/export flow

Phase 2C intentionally avoids platform sharing dependencies. A later phase can add a separate orchestration layer that:

1. Builds `ParcelReportData` from live parcel, zoning, risk, AI, and valuation sources.
2. Captures a static map snapshot and passes it as `mapSnapshotBytes`.
3. Calls `PremiumParcelReportService.generatePremiumParcelReport` to receive PDF bytes.
4. Persists the bytes to a temporary file or cloud storage.
5. Creates a verified reference URL/QR code.
6. Invokes platform share, download, print, or in-app preview UI outside the pure report service.

The parcel detail sheet currently generates bytes and shows a fail-soft snackbar with the byte size; it does not route, save, or share files.

## Legal and KVKK disclaimers

Reports are informational only and are not official zoning, title deed, license, plan note, or encumbrance documents. Before an investment or legal decision, users must verify records with the municipality, land registry, and relevant public institutions.

Until live data integrations are complete, reports should keep `usesMockData` enabled and display the mock-data watermark. Personal data should not be included unless a future consent and retention flow explicitly supports it under KVKK requirements.
