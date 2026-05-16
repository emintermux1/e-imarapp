# Turkey source coverage metadata

This project intentionally separates *coverage metadata* from *official parcel or zoning results*.

## Access semantics

- `public`: the source is openly reachable and can be probed without auth.
- `public_metadata`: only public homepage, catalog, documentation, or provider metadata is exposed.
- `metadata_only`: the registry contains documentation or catalog metadata only, not a callable parcel/imar source.
- `requires_credentials`: a live workflow exists but needs credentials or an authenticated session.
- `requires_legal_agreement`: access is technically possible only under a formal protocol, license, or legal agreement.

Protected sources are never treated as available parcel data. The registry may carry their public homepage and legal metadata, but the product must surface the correct status instead of inventing results.

## What the coverage dataset contains

- All 81 Turkish provinces with plate codes and region labels.
- National sources such as TKGM Parsel Sorgu, TKGM data-sharing rules, e-Plan, TUCBS, Atlas, ÇŞB CBS, Yerel Veri Platformları, BulutKBS, MAKS, and major provider documentation pages.
- Broad municipal public portal coverage derived from known patterns such as Netcad KEOS, WebGIS, eKent, municipal KBS portals, and CBS hostnames.
- Global basemap and imagery metadata for OSM, Esri World Imagery, Copernicus, Landsat, Mapbox, MapTiler, HERE, and Cesium ion.

## Why the product can feel Turkey-scale without fake data

The UI can show:

- national vs municipal coverage counts,
- source counts by province, vendor, category, access status, and capability,
- the top covered provinces,
- provinces that still need endpoint discovery,
- and which sources are protected or require legal access.

This gives a realistic coverage surface while staying honest about what is actually verified.

## Operational rule

Do not convert metadata into official parcel results.

If discovery has not resolved the public endpoint contract, the downstream workflow must preserve the public/provenance state and show the appropriate next action instead of returning fabricated parcel, zoning, or plan data.
