# Netcad / KEOS connector strategy

Most public KEOS imar pages render a map application and call backend service endpoints directly from JavaScript. If there is no login and no bot protection, ingestion should not scrape pixels from the page. It should discover and call the same service contracts used by the public page.

## Flow

1. Fetch the public imar page, e.g. `https://keos.pendik.bel.tr/imardurumu/`.
2. Extract same-origin JavaScript assets from `<script src="...">`.
3. Search HTML/JS for service references:
   - `.ashx`
   - `.asmx`
   - `NetGIS`
   - `arcgis/rest`
   - `geoserver`
   - `GetCapabilities`
4. Probe common KEOS candidates:
   - `/NetGIS/Services/MapService.ashx`
   - `/NetGIS/Services/QueryService.ashx`
   - `/NetGIS/Services/GeometryService.ashx`
   - `/imardurumu/Services/ImarDurumu.ashx`
   - `/imardurumu/Services/ImarDurumu.asmx`
   - `/imardurumu/Service/ImarDurumu.ashx`
   - `/imardurumu/Service/ImarDurumu.asmx`
   - `/imardurumu/Services/MapService.ashx`
   - `/imardurumu/Services/QueryService.ashx`
   - `/imardurumu/Services/Proxy.ashx`
5. If ASMX exists, inspect `?WSDL` and method pages before calling methods.
6. If ASHX exists, use the discovered JavaScript request payloads and normalize responses.
7. Persist provenance:
   - `source_id`
   - connector endpoint
   - request payload
   - response hash
   - fetched timestamp
8. Normalize verified parcel/plan/zoning geometries into PostGIS.

## API

- `GET /connectors/netcad/strategy`
- `POST /connectors/:id/netcad/discover`
- `POST /connectors/public-health` or `POST /connectors/discover-public`

Example:

```bash
curl -X POST http://localhost:3000/connectors/pendik-keos-imar/netcad/discover
curl -X POST 'http://localhost:3000/connectors/public-health?province=İstanbul&vendor=netcad&limit=10'
```

Bulk public health discovery only probes registry sources whose access status is `public`, `public_metadata`, or `unknown`. Sources marked `requires_credentials` or `requires_legal_agreement` are returned as `skipped_protected`; no login, captcha, cookie, token, or legal boundary is bypassed. The default limit is intentionally low (25) with a hard cap of 50 so municipal sites are not overloaded. Bulk health uses candidate endpoint probes only; deeper Netcad HTML/JavaScript service discovery remains opt-in per source through `POST /connectors/:id/netcad/discover`.

## Important guardrails

- No fake parcel or imar result is generated.
- If a service method contract cannot be discovered, the connector remains `unsupported_format` or `endpoint_changed`.
- If a source later introduces captcha/session protection, it becomes `captcha_required` or `requires_credentials`.
## Registered public municipal seeds

The registry includes the previously seeded KEOS/WebGIS/eKent portals plus `suleymanpasa-keos-imar`, `mustafakemalpasa-keos-imar`, `gelibolu-keos-imar`, `caycuma-keos`, and `kecioren-kbs`. Ported homepages such as `:444`, `:8880`, `:8282`, and `:8080` are kept exactly when generating candidate endpoints.

Public portal discovery is metadata-only until probes confirm an endpoint contract. Login, captcha, session, or legal approval boundaries are returned as explicit statuses and are not bypassed. Map provider credentials are referenced only by environment variable name: `MAPTILER_API_KEY`, `MAPBOX_ACCESS_TOKEN`, `CESIUM_ION_TOKEN`, and `HERE_API_KEY`.

