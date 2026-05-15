import type { SourceDetailResponse, SourceEntry, SourceHealthResponse, SourcesResponse } from "@/lib/api/types";

export const FALLBACK_SOURCES: SourceEntry[] = [
  {
    "id": "tkgm-parsel-sorgu",
    "name": "TKGM Parsel Sorgu",
    "base_url": "https://parselsorgu.tkgm.gov.tr/",
    "provider": "tkgm",
    "auth": "requires_legal_agreement",
    "category": "parcel",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "parcel_lookup",
      "parcel_geometry"
    ],
    "municipality_name": null,
    "notes": "Official parcel query portal; lawful automation, session, captcha, and data-sharing constraints must be verified at runtime."
  },
  {
    "id": "tkgm-data-sharing-docs",
    "name": "TKGM Veri Paylaşımı Usul ve Esasları",
    "base_url": "https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar",
    "provider": "tkgm",
    "auth": "public_metadata",
    "category": "parcel",
    "discovery_strategy": "documentation",
    "capabilities": [
      "legal_reference"
    ],
    "municipality_name": null,
    "notes": "Official legal documentation page for data-sharing rules; it is not a data API endpoint."
  },
  {
    "id": "eplan-csb",
    "name": "e-Plan ÇŞB",
    "base_url": "https://eplan.csb.gov.tr/",
    "provider": "csb",
    "auth": "public_metadata",
    "category": "plan",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "plan_catalog",
      "plan_lookup"
    ],
    "municipality_name": null,
    "notes": "Official e-Plan portal; public plan catalog and protected workflows must be separated by discovery."
  },
  {
    "id": "e-plan",
    "name": "e-Plan Portalı",
    "base_url": "https://e-plan.gov.tr/",
    "provider": "csb",
    "auth": "public_metadata",
    "category": "plan",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "plan_catalog"
    ],
    "municipality_name": null,
    "notes": "Legacy or alternate e-Plan hostname retained for discovery compatibility and canonical redirect checks."
  },
  {
    "id": "tucbs-public-api",
    "name": "TUCBS Public API",
    "base_url": "https://tucbs-public-api.csb.gov.tr/",
    "provider": "csb",
    "auth": "public_metadata",
    "category": "open_data",
    "discovery_strategy": "ogc,public_api",
    "capabilities": [
      "wms",
      "wfs",
      "geospatial_api",
      "plan_catalog"
    ],
    "municipality_name": null,
    "notes": "National or global metadata entry. Discovery must keep public metadata separate from live legal access and never fabricate parcel, zoning, or address results."
  },
  {
    "id": "tucbs",
    "name": "TUCBS Ana Portal",
    "base_url": "https://tucbs.gov.tr/",
    "provider": "csb",
    "auth": "public_metadata",
    "category": "open_data",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "geospatial_catalog",
      "wms",
      "wfs"
    ],
    "municipality_name": null,
    "notes": "National CBS portal and metadata entry point; exact service access is determined per catalog endpoint."
  },
  {
    "id": "atlas",
    "name": "Atlas",
    "base_url": "https://www.atlas.gov.tr/",
    "provider": "csb",
    "auth": "public_metadata",
    "category": "open_data",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "basemap_context",
      "geospatial_catalog",
      "wms"
    ],
    "municipality_name": null,
    "notes": "National or global metadata entry. Discovery must keep public metadata separate from live legal access and never fabricate parcel, zoning, or address results."
  },
  {
    "id": "csb-cbs",
    "name": "ÇŞB Coğrafi Bilgi Sistemleri",
    "base_url": "https://cbs.csb.gov.tr/",
    "provider": "csb",
    "auth": "public_metadata",
    "category": "open_data",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "geospatial_catalog",
      "wms",
      "wfs"
    ],
    "municipality_name": null,
    "notes": "Official CBS portal; only public catalog metadata should be harvested without authenticated agreements."
  },
  {
    "id": "yerel-veri-platformlari",
    "name": "Yerel Veri Platformları",
    "base_url": "https://akillisehirler.csb.gov.tr/yerel-veri-platformlari/",
    "provider": "csb",
    "auth": "public_metadata",
    "category": "open_data",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "municipal_gis",
      "geospatial_catalog"
    ],
    "municipality_name": null,
    "notes": "Official local data platforms page; discovery should collect public metadata links only."
  },
  {
    "id": "bulutkbs",
    "name": "BulutKBS",
    "base_url": "https://bulutkbs.gov.tr/",
    "provider": "bulutkbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "parcel_lookup"
    ],
    "municipality_name": null,
    "notes": "Public/institutional KBS portal; the registry only carries safe metadata and does not assert live endpoint availability."
  },
  {
    "id": "maks",
    "name": "MAKS",
    "base_url": "https://maks.nvi.gov.tr/",
    "provider": "nvi",
    "auth": "requires_legal_agreement",
    "category": "address",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "address_registry"
    ],
    "municipality_name": null,
    "notes": "MAKS production integration requires official legal protocol and institutional credentials."
  },
  {
    "id": "netcad-arazi-yonetimi",
    "name": "Netcad Arazi Yönetimi Referansı",
    "base_url": "https://www.netcad.com/tr/cozumler/arazi-yonetimi#incele",
    "provider": "netcad",
    "auth": "public_metadata",
    "category": "municipal_gis",
    "discovery_strategy": "documentation",
    "capabilities": [
      "netcad_keos",
      "municipal_gis"
    ],
    "municipality_name": null,
    "notes": "Vendor reference page for land management and Netcad implementation patterns; not a municipal data source."
  },
  {
    "id": "netcad-netgis-server",
    "name": "Netcad NetGIS Server",
    "base_url": "https://www.netcad.com/netgis-server",
    "provider": "netcad",
    "auth": "public_metadata",
    "category": "municipal_gis",
    "discovery_strategy": "documentation",
    "capabilities": [
      "netcad_keos",
      "municipal_gis"
    ],
    "municipality_name": null,
    "notes": "Vendor documentation and fingerprint reference for NetGIS/KEOS patterns; not itself a parcel data source."
  },
  {
    "id": "copernicus-data-space",
    "name": "Copernicus Data Space Ecosystem",
    "base_url": "https://dataspace.copernicus.eu/",
    "provider": "copernicus",
    "auth": "requires_credentials",
    "category": "satellite",
    "discovery_strategy": "public_api",
    "capabilities": [
      "satellite_imagery"
    ],
    "municipality_name": null,
    "notes": "Sentinel data APIs can require official account or OAuth; no tokens are stored in registry metadata."
  },
  {
    "id": "esri-world-imagery",
    "name": "Esri World Imagery",
    "base_url": "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
    "provider": "esri",
    "auth": "public_metadata",
    "category": "basemap",
    "discovery_strategy": "arcgis_rest",
    "capabilities": [
      "arcgis_rest",
      "basemap_context"
    ],
    "municipality_name": null,
    "notes": "Public ArcGIS REST imagery endpoint; production usage must follow Esri terms and live service metadata."
  },
  {
    "id": "mapbox-maps-api",
    "name": "Mapbox Maps API",
    "base_url": "https://docs.mapbox.com/api/maps/",
    "provider": "mapbox",
    "auth": "requires_credentials",
    "category": "tile_service",
    "discovery_strategy": "documentation",
    "capabilities": [
      "basemap_context"
    ],
    "municipality_name": null,
    "notes": "Commercial map API requires MAPBOX_ACCESS_TOKEN via environment variables and terms-compliant use."
  },
  {
    "id": "maptiler-cloud-api",
    "name": "MapTiler Cloud API",
    "base_url": "https://docs.maptiler.com/cloud/api/",
    "provider": "maptiler",
    "auth": "requires_credentials",
    "category": "tile_service",
    "discovery_strategy": "documentation",
    "capabilities": [
      "basemap_context"
    ],
    "municipality_name": null,
    "notes": "Commercial map API requires MAPTILER_API_KEY via environment variables and terms-compliant use."
  },
  {
    "id": "here-map-tile-api",
    "name": "HERE APIs",
    "base_url": "https://developer.here.com/documentation",
    "provider": "here",
    "auth": "requires_credentials",
    "category": "tile_service",
    "discovery_strategy": "documentation",
    "capabilities": [
      "basemap_context"
    ],
    "municipality_name": null,
    "notes": "HERE APIs require HERE_API_KEY via environment variables and product-specific license review."
  },
  {
    "id": "cesium-ion",
    "name": "Cesium ion",
    "base_url": "https://cesium.com/platform/cesium-ion/",
    "provider": "cesium",
    "auth": "requires_credentials",
    "category": "tile_service",
    "discovery_strategy": "documentation",
    "capabilities": [
      "basemap_context"
    ],
    "municipality_name": null,
    "notes": "Cesium ion requires CESIUM_ION_TOKEN via environment variables for hosted terrain and 3D Tiles."
  },
  {
    "id": "openstreetmap-api",
    "name": "OpenStreetMap API",
    "base_url": "https://wiki.openstreetmap.org/wiki/API",
    "provider": "openstreetmap",
    "auth": "public_metadata",
    "category": "basemap",
    "discovery_strategy": "public_api",
    "capabilities": [
      "basemap_context"
    ],
    "municipality_name": null,
    "notes": "Public OSM documentation. Production use must respect OSM tile and API usage policies."
  },
  {
    "id": "usgs-landsat",
    "name": "USGS Landsat Data",
    "base_url": "https://landsat.gsfc.nasa.gov/data/",
    "provider": "usgs",
    "auth": "public_metadata",
    "category": "satellite",
    "discovery_strategy": "public_portal",
    "capabilities": [
      "satellite_imagery"
    ],
    "municipality_name": null,
    "notes": "Landsat data portal documentation; exact API account requirements must be verified per product."
  },
  {
    "id": "adana-netcad-coverage-candidate",
    "name": "Adana İmar Portalı Adayı",
    "base_url": "https://keos.adana.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Adana",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "adiyaman-webgis-coverage-candidate",
    "name": "Adıyaman İmar Portalı Adayı",
    "base_url": "https://webgis.adiyaman.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Adıyaman",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "afyonkarahisar-ekent-coverage-candidate",
    "name": "Afyonkarahisar İmar Portalı Adayı",
    "base_url": "https://ekent.afyonkarahisar.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Afyonkarahisar",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "agri-municipal-coverage-candidate",
    "name": "Ağrı İmar Portalı Adayı",
    "base_url": "https://cbs.agri.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Ağrı",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "amasya-kbs-coverage-candidate",
    "name": "Amasya İmar Portalı Adayı",
    "base_url": "https://kbs.amasya.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Amasya",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "ankara-netcad-coverage-candidate",
    "name": "Ankara İmar Portalı Adayı",
    "base_url": "https://keos.ankara.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Ankara",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "antalya-webgis-coverage-candidate",
    "name": "Antalya İmar Portalı Adayı",
    "base_url": "https://webgis.antalya.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Antalya",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "artvin-ekent-coverage-candidate",
    "name": "Artvin İmar Portalı Adayı",
    "base_url": "https://ekent.artvin.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Artvin",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "aydin-municipal-coverage-candidate",
    "name": "Aydın İmar Portalı Adayı",
    "base_url": "https://cbs.aydin.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Aydın",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "balikesir-kbs-coverage-candidate",
    "name": "Balıkesir İmar Portalı Adayı",
    "base_url": "https://kbs.balikesir.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Balıkesir",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "bilecik-netcad-coverage-candidate",
    "name": "Bilecik İmar Portalı Adayı",
    "base_url": "https://keos.bilecik.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Bilecik",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "bingol-webgis-coverage-candidate",
    "name": "Bingöl İmar Portalı Adayı",
    "base_url": "https://webgis.bingol.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Bingöl",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "bitlis-ekent-coverage-candidate",
    "name": "Bitlis İmar Portalı Adayı",
    "base_url": "https://ekent.bitlis.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Bitlis",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "bolu-municipal-coverage-candidate",
    "name": "Bolu İmar Portalı Adayı",
    "base_url": "https://cbs.bolu.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Bolu",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "burdur-kbs-coverage-candidate",
    "name": "Burdur İmar Portalı Adayı",
    "base_url": "https://kbs.burdur.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Burdur",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "bursa-netcad-coverage-candidate",
    "name": "Bursa İmar Portalı Adayı",
    "base_url": "https://keos.bursa.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Bursa",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "canakkale-webgis-coverage-candidate",
    "name": "Çanakkale İmar Portalı Adayı",
    "base_url": "https://webgis.canakkale.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Çanakkale",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "cankiri-ekent-coverage-candidate",
    "name": "Çankırı İmar Portalı Adayı",
    "base_url": "https://ekent.cankiri.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Çankırı",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "corum-municipal-coverage-candidate",
    "name": "Çorum İmar Portalı Adayı",
    "base_url": "https://cbs.corum.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Çorum",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "denizli-kbs-coverage-candidate",
    "name": "Denizli İmar Portalı Adayı",
    "base_url": "https://kbs.denizli.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Denizli",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "diyarbakir-netcad-coverage-candidate",
    "name": "Diyarbakır İmar Portalı Adayı",
    "base_url": "https://keos.diyarbakir.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Diyarbakır",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "edirne-webgis-coverage-candidate",
    "name": "Edirne İmar Portalı Adayı",
    "base_url": "https://webgis.edirne.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Edirne",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "elazig-ekent-coverage-candidate",
    "name": "Elazığ İmar Portalı Adayı",
    "base_url": "https://ekent.elazig.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Elazığ",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "erzincan-municipal-coverage-candidate",
    "name": "Erzincan İmar Portalı Adayı",
    "base_url": "https://cbs.erzincan.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Erzincan",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "erzurum-kbs-coverage-candidate",
    "name": "Erzurum İmar Portalı Adayı",
    "base_url": "https://kbs.erzurum.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Erzurum",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "eskisehir-netcad-coverage-candidate",
    "name": "Eskişehir İmar Portalı Adayı",
    "base_url": "https://keos.eskisehir.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Eskişehir",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "gaziantep-webgis-coverage-candidate",
    "name": "Gaziantep İmar Portalı Adayı",
    "base_url": "https://webgis.gaziantep.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Gaziantep",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "giresun-ekent-coverage-candidate",
    "name": "Giresun İmar Portalı Adayı",
    "base_url": "https://ekent.giresun.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Giresun",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "gumushane-municipal-coverage-candidate",
    "name": "Gümüşhane İmar Portalı Adayı",
    "base_url": "https://cbs.gumushane.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Gümüşhane",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "hakkari-kbs-coverage-candidate",
    "name": "Hakkari İmar Portalı Adayı",
    "base_url": "https://kbs.hakkari.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Hakkari",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "hatay-netcad-coverage-candidate",
    "name": "Hatay İmar Portalı Adayı",
    "base_url": "https://keos.hatay.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Hatay",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "isparta-webgis-coverage-candidate",
    "name": "Isparta İmar Portalı Adayı",
    "base_url": "https://webgis.isparta.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Isparta",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "mersin-ekent-coverage-candidate",
    "name": "Mersin İmar Portalı Adayı",
    "base_url": "https://ekent.mersin.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Mersin",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "istanbul-municipal-coverage-candidate",
    "name": "İstanbul İmar Portalı Adayı",
    "base_url": "https://cbs.istanbul.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "İstanbul",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "izmir-kbs-coverage-candidate",
    "name": "İzmir İmar Portalı Adayı",
    "base_url": "https://kbs.izmir.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "İzmir",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kars-netcad-coverage-candidate",
    "name": "Kars İmar Portalı Adayı",
    "base_url": "https://keos.kars.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Kars",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kastamonu-webgis-coverage-candidate",
    "name": "Kastamonu İmar Portalı Adayı",
    "base_url": "https://webgis.kastamonu.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Kastamonu",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kayseri-ekent-coverage-candidate",
    "name": "Kayseri İmar Portalı Adayı",
    "base_url": "https://ekent.kayseri.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Kayseri",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kirklareli-municipal-coverage-candidate",
    "name": "Kırklareli İmar Portalı Adayı",
    "base_url": "https://cbs.kirklareli.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Kırklareli",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kirsehir-kbs-coverage-candidate",
    "name": "Kırşehir İmar Portalı Adayı",
    "base_url": "https://kbs.kirsehir.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Kırşehir",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kocaeli-netcad-coverage-candidate",
    "name": "Kocaeli İmar Portalı Adayı",
    "base_url": "https://keos.kocaeli.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Kocaeli",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "konya-webgis-coverage-candidate",
    "name": "Konya İmar Portalı Adayı",
    "base_url": "https://webgis.konya.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Konya",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kutahya-ekent-coverage-candidate",
    "name": "Kütahya İmar Portalı Adayı",
    "base_url": "https://ekent.kutahya.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Kütahya",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "malatya-municipal-coverage-candidate",
    "name": "Malatya İmar Portalı Adayı",
    "base_url": "https://cbs.malatya.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Malatya",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "manisa-kbs-coverage-candidate",
    "name": "Manisa İmar Portalı Adayı",
    "base_url": "https://kbs.manisa.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Manisa",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kahramanmaras-netcad-coverage-candidate",
    "name": "Kahramanmaraş İmar Portalı Adayı",
    "base_url": "https://keos.kahramanmaras.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Kahramanmaraş",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "mardin-webgis-coverage-candidate",
    "name": "Mardin İmar Portalı Adayı",
    "base_url": "https://webgis.mardin.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Mardin",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "mugla-ekent-coverage-candidate",
    "name": "Muğla İmar Portalı Adayı",
    "base_url": "https://ekent.mugla.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Muğla",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "mus-municipal-coverage-candidate",
    "name": "Muş İmar Portalı Adayı",
    "base_url": "https://cbs.mus.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Muş",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "nevsehir-kbs-coverage-candidate",
    "name": "Nevşehir İmar Portalı Adayı",
    "base_url": "https://kbs.nevsehir.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Nevşehir",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "nigde-netcad-coverage-candidate",
    "name": "Niğde İmar Portalı Adayı",
    "base_url": "https://keos.nigde.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Niğde",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "ordu-webgis-coverage-candidate",
    "name": "Ordu İmar Portalı Adayı",
    "base_url": "https://webgis.ordu.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Ordu",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "rize-ekent-coverage-candidate",
    "name": "Rize İmar Portalı Adayı",
    "base_url": "https://ekent.rize.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Rize",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "sakarya-municipal-coverage-candidate",
    "name": "Sakarya İmar Portalı Adayı",
    "base_url": "https://cbs.sakarya.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Sakarya",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "samsun-kbs-coverage-candidate",
    "name": "Samsun İmar Portalı Adayı",
    "base_url": "https://kbs.samsun.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Samsun",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "siirt-netcad-coverage-candidate",
    "name": "Siirt İmar Portalı Adayı",
    "base_url": "https://keos.siirt.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Siirt",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "sinop-webgis-coverage-candidate",
    "name": "Sinop İmar Portalı Adayı",
    "base_url": "https://webgis.sinop.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Sinop",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "sivas-ekent-coverage-candidate",
    "name": "Sivas İmar Portalı Adayı",
    "base_url": "https://ekent.sivas.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Sivas",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "tekirdag-municipal-coverage-candidate",
    "name": "Tekirdağ İmar Portalı Adayı",
    "base_url": "https://cbs.tekirdag.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Tekirdağ",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "tokat-kbs-coverage-candidate",
    "name": "Tokat İmar Portalı Adayı",
    "base_url": "https://kbs.tokat.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Tokat",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "trabzon-netcad-coverage-candidate",
    "name": "Trabzon İmar Portalı Adayı",
    "base_url": "https://keos.trabzon.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Trabzon",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "tunceli-webgis-coverage-candidate",
    "name": "Tunceli İmar Portalı Adayı",
    "base_url": "https://webgis.tunceli.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Tunceli",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "sanliurfa-ekent-coverage-candidate",
    "name": "Şanlıurfa İmar Portalı Adayı",
    "base_url": "https://ekent.sanliurfa.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Şanlıurfa",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "usak-municipal-coverage-candidate",
    "name": "Uşak İmar Portalı Adayı",
    "base_url": "https://cbs.usak.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Uşak",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "van-kbs-coverage-candidate",
    "name": "Van İmar Portalı Adayı",
    "base_url": "https://kbs.van.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Van",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "yozgat-netcad-coverage-candidate",
    "name": "Yozgat İmar Portalı Adayı",
    "base_url": "https://keos.yozgat.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Yozgat",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "zonguldak-webgis-coverage-candidate",
    "name": "Zonguldak İmar Portalı Adayı",
    "base_url": "https://webgis.zonguldak.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Zonguldak",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "aksaray-ekent-coverage-candidate",
    "name": "Aksaray İmar Portalı Adayı",
    "base_url": "https://ekent.aksaray.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Aksaray",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "bayburt-municipal-coverage-candidate",
    "name": "Bayburt İmar Portalı Adayı",
    "base_url": "https://cbs.bayburt.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Bayburt",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "karaman-kbs-coverage-candidate",
    "name": "Karaman İmar Portalı Adayı",
    "base_url": "https://kbs.karaman.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Karaman",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kirikkale-netcad-coverage-candidate",
    "name": "Kırıkkale İmar Portalı Adayı",
    "base_url": "https://keos.kirikkale.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Kırıkkale",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "batman-webgis-coverage-candidate",
    "name": "Batman İmar Portalı Adayı",
    "base_url": "https://webgis.batman.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Batman",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "sirnak-ekent-coverage-candidate",
    "name": "Şırnak İmar Portalı Adayı",
    "base_url": "https://ekent.sirnak.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Şırnak",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "bartin-municipal-coverage-candidate",
    "name": "Bartın İmar Portalı Adayı",
    "base_url": "https://cbs.bartin.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Bartın",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "ardahan-kbs-coverage-candidate",
    "name": "Ardahan İmar Portalı Adayı",
    "base_url": "https://kbs.ardahan.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Ardahan",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "igdir-netcad-coverage-candidate",
    "name": "Iğdır İmar Portalı Adayı",
    "base_url": "https://keos.igdir.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Iğdır",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "yalova-webgis-coverage-candidate",
    "name": "Yalova İmar Portalı Adayı",
    "base_url": "https://webgis.yalova.bel.tr/imardurumu/",
    "provider": "webgis",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis"
    ],
    "municipality_name": "Yalova",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "karabuk-ekent-coverage-candidate",
    "name": "Karabük İmar Portalı Adayı",
    "base_url": "https://ekent.karabuk.bel.tr/imardurumu/",
    "provider": "ekent",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "ekent"
    ],
    "municipality_name": "Karabük",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "kilis-municipal-coverage-candidate",
    "name": "Kilis İmar Portalı Adayı",
    "base_url": "https://cbs.kilis.bel.tr/",
    "provider": "municipal",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Kilis",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "osmaniye-kbs-coverage-candidate",
    "name": "Osmaniye İmar Portalı Adayı",
    "base_url": "https://kbs.osmaniye.bel.tr/",
    "provider": "kbs",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "municipal_gis",
      "zoning_status"
    ],
    "municipality_name": "Osmaniye",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  },
  {
    "id": "duzce-netcad-coverage-candidate",
    "name": "Düzce İmar Portalı Adayı",
    "base_url": "https://keos.duzce.bel.tr/imardurumu/",
    "provider": "netcad",
    "auth": "metadata_only",
    "category": "municipal_gis",
    "discovery_strategy": "metadata_only_candidate",
    "capabilities": [
      "zoning_status",
      "municipal_gis",
      "netcad_keos"
    ],
    "municipality_name": "Düzce",
    "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
  }
];

export const FALLBACK_SOURCE_HEALTH: SourceHealthResponse = {
  "status": "fallback",
  "message": "Backend erişilemediğinde güvenli yerel kaynak metadata görünümü.",
  "total": 102,
  "rollup": {
    "requires_legal_agreement": 2,
    "public_metadata": 13,
    "metadata_only": 82,
    "requires_credentials": 5
  },
  "sources": [
    {
      "id": "tkgm-parsel-sorgu",
      "name": "TKGM Parsel Sorgu",
      "base_url": "https://parselsorgu.tkgm.gov.tr/",
      "provider": "tkgm",
      "auth": "requires_legal_agreement",
      "category": "parcel",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "parcel_lookup",
        "parcel_geometry"
      ],
      "municipality_name": null,
      "notes": "Official parcel query portal; lawful automation, session, captcha, and data-sharing constraints must be verified at runtime.",
      "status": "requires_legal_agreement",
      "discovered_endpoints": [],
      "message": "Official parcel query portal; lawful automation, session, captcha, and data-sharing constraints must be verified at runtime."
    },
    {
      "id": "tkgm-data-sharing-docs",
      "name": "TKGM Veri Paylaşımı Usul ve Esasları",
      "base_url": "https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar",
      "provider": "tkgm",
      "auth": "public_metadata",
      "category": "parcel",
      "discovery_strategy": "documentation",
      "capabilities": [
        "legal_reference"
      ],
      "municipality_name": null,
      "notes": "Official legal documentation page for data-sharing rules; it is not a data API endpoint.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Official legal documentation page for data-sharing rules; it is not a data API endpoint."
    },
    {
      "id": "eplan-csb",
      "name": "e-Plan ÇŞB",
      "base_url": "https://eplan.csb.gov.tr/",
      "provider": "csb",
      "auth": "public_metadata",
      "category": "plan",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "plan_catalog",
        "plan_lookup"
      ],
      "municipality_name": null,
      "notes": "Official e-Plan portal; public plan catalog and protected workflows must be separated by discovery.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Official e-Plan portal; public plan catalog and protected workflows must be separated by discovery."
    },
    {
      "id": "e-plan",
      "name": "e-Plan Portalı",
      "base_url": "https://e-plan.gov.tr/",
      "provider": "csb",
      "auth": "public_metadata",
      "category": "plan",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "plan_catalog"
      ],
      "municipality_name": null,
      "notes": "Legacy or alternate e-Plan hostname retained for discovery compatibility and canonical redirect checks.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Legacy or alternate e-Plan hostname retained for discovery compatibility and canonical redirect checks."
    },
    {
      "id": "tucbs-public-api",
      "name": "TUCBS Public API",
      "base_url": "https://tucbs-public-api.csb.gov.tr/",
      "provider": "csb",
      "auth": "public_metadata",
      "category": "open_data",
      "discovery_strategy": "ogc,public_api",
      "capabilities": [
        "wms",
        "wfs",
        "geospatial_api",
        "plan_catalog"
      ],
      "municipality_name": null,
      "notes": "National or global metadata entry. Discovery must keep public metadata separate from live legal access and never fabricate parcel, zoning, or address results.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "National or global metadata entry. Discovery must keep public metadata separate from live legal access and never fabricate parcel, zoning, or address results."
    },
    {
      "id": "tucbs",
      "name": "TUCBS Ana Portal",
      "base_url": "https://tucbs.gov.tr/",
      "provider": "csb",
      "auth": "public_metadata",
      "category": "open_data",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "geospatial_catalog",
        "wms",
        "wfs"
      ],
      "municipality_name": null,
      "notes": "National CBS portal and metadata entry point; exact service access is determined per catalog endpoint.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "National CBS portal and metadata entry point; exact service access is determined per catalog endpoint."
    },
    {
      "id": "atlas",
      "name": "Atlas",
      "base_url": "https://www.atlas.gov.tr/",
      "provider": "csb",
      "auth": "public_metadata",
      "category": "open_data",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "basemap_context",
        "geospatial_catalog",
        "wms"
      ],
      "municipality_name": null,
      "notes": "National or global metadata entry. Discovery must keep public metadata separate from live legal access and never fabricate parcel, zoning, or address results.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "National or global metadata entry. Discovery must keep public metadata separate from live legal access and never fabricate parcel, zoning, or address results."
    },
    {
      "id": "csb-cbs",
      "name": "ÇŞB Coğrafi Bilgi Sistemleri",
      "base_url": "https://cbs.csb.gov.tr/",
      "provider": "csb",
      "auth": "public_metadata",
      "category": "open_data",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "geospatial_catalog",
        "wms",
        "wfs"
      ],
      "municipality_name": null,
      "notes": "Official CBS portal; only public catalog metadata should be harvested without authenticated agreements.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Official CBS portal; only public catalog metadata should be harvested without authenticated agreements."
    },
    {
      "id": "yerel-veri-platformlari",
      "name": "Yerel Veri Platformları",
      "base_url": "https://akillisehirler.csb.gov.tr/yerel-veri-platformlari/",
      "provider": "csb",
      "auth": "public_metadata",
      "category": "open_data",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "municipal_gis",
        "geospatial_catalog"
      ],
      "municipality_name": null,
      "notes": "Official local data platforms page; discovery should collect public metadata links only.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Official local data platforms page; discovery should collect public metadata links only."
    },
    {
      "id": "bulutkbs",
      "name": "BulutKBS",
      "base_url": "https://bulutkbs.gov.tr/",
      "provider": "bulutkbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "parcel_lookup"
      ],
      "municipality_name": null,
      "notes": "Public/institutional KBS portal; the registry only carries safe metadata and does not assert live endpoint availability.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Public/institutional KBS portal; the registry only carries safe metadata and does not assert live endpoint availability."
    },
    {
      "id": "maks",
      "name": "MAKS",
      "base_url": "https://maks.nvi.gov.tr/",
      "provider": "nvi",
      "auth": "requires_legal_agreement",
      "category": "address",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "address_registry"
      ],
      "municipality_name": null,
      "notes": "MAKS production integration requires official legal protocol and institutional credentials.",
      "status": "requires_legal_agreement",
      "discovered_endpoints": [],
      "message": "MAKS production integration requires official legal protocol and institutional credentials."
    },
    {
      "id": "netcad-arazi-yonetimi",
      "name": "Netcad Arazi Yönetimi Referansı",
      "base_url": "https://www.netcad.com/tr/cozumler/arazi-yonetimi#incele",
      "provider": "netcad",
      "auth": "public_metadata",
      "category": "municipal_gis",
      "discovery_strategy": "documentation",
      "capabilities": [
        "netcad_keos",
        "municipal_gis"
      ],
      "municipality_name": null,
      "notes": "Vendor reference page for land management and Netcad implementation patterns; not a municipal data source.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Vendor reference page for land management and Netcad implementation patterns; not a municipal data source."
    },
    {
      "id": "netcad-netgis-server",
      "name": "Netcad NetGIS Server",
      "base_url": "https://www.netcad.com/netgis-server",
      "provider": "netcad",
      "auth": "public_metadata",
      "category": "municipal_gis",
      "discovery_strategy": "documentation",
      "capabilities": [
        "netcad_keos",
        "municipal_gis"
      ],
      "municipality_name": null,
      "notes": "Vendor documentation and fingerprint reference for NetGIS/KEOS patterns; not itself a parcel data source.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Vendor documentation and fingerprint reference for NetGIS/KEOS patterns; not itself a parcel data source."
    },
    {
      "id": "copernicus-data-space",
      "name": "Copernicus Data Space Ecosystem",
      "base_url": "https://dataspace.copernicus.eu/",
      "provider": "copernicus",
      "auth": "requires_credentials",
      "category": "satellite",
      "discovery_strategy": "public_api",
      "capabilities": [
        "satellite_imagery"
      ],
      "municipality_name": null,
      "notes": "Sentinel data APIs can require official account or OAuth; no tokens are stored in registry metadata.",
      "status": "requires_credentials",
      "discovered_endpoints": [],
      "message": "Sentinel data APIs can require official account or OAuth; no tokens are stored in registry metadata."
    },
    {
      "id": "esri-world-imagery",
      "name": "Esri World Imagery",
      "base_url": "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
      "provider": "esri",
      "auth": "public_metadata",
      "category": "basemap",
      "discovery_strategy": "arcgis_rest",
      "capabilities": [
        "arcgis_rest",
        "basemap_context"
      ],
      "municipality_name": null,
      "notes": "Public ArcGIS REST imagery endpoint; production usage must follow Esri terms and live service metadata.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Public ArcGIS REST imagery endpoint; production usage must follow Esri terms and live service metadata."
    },
    {
      "id": "mapbox-maps-api",
      "name": "Mapbox Maps API",
      "base_url": "https://docs.mapbox.com/api/maps/",
      "provider": "mapbox",
      "auth": "requires_credentials",
      "category": "tile_service",
      "discovery_strategy": "documentation",
      "capabilities": [
        "basemap_context"
      ],
      "municipality_name": null,
      "notes": "Commercial map API requires MAPBOX_ACCESS_TOKEN via environment variables and terms-compliant use.",
      "status": "requires_credentials",
      "discovered_endpoints": [],
      "message": "Commercial map API requires MAPBOX_ACCESS_TOKEN via environment variables and terms-compliant use."
    },
    {
      "id": "maptiler-cloud-api",
      "name": "MapTiler Cloud API",
      "base_url": "https://docs.maptiler.com/cloud/api/",
      "provider": "maptiler",
      "auth": "requires_credentials",
      "category": "tile_service",
      "discovery_strategy": "documentation",
      "capabilities": [
        "basemap_context"
      ],
      "municipality_name": null,
      "notes": "Commercial map API requires MAPTILER_API_KEY via environment variables and terms-compliant use.",
      "status": "requires_credentials",
      "discovered_endpoints": [],
      "message": "Commercial map API requires MAPTILER_API_KEY via environment variables and terms-compliant use."
    },
    {
      "id": "here-map-tile-api",
      "name": "HERE APIs",
      "base_url": "https://developer.here.com/documentation",
      "provider": "here",
      "auth": "requires_credentials",
      "category": "tile_service",
      "discovery_strategy": "documentation",
      "capabilities": [
        "basemap_context"
      ],
      "municipality_name": null,
      "notes": "HERE APIs require HERE_API_KEY via environment variables and product-specific license review.",
      "status": "requires_credentials",
      "discovered_endpoints": [],
      "message": "HERE APIs require HERE_API_KEY via environment variables and product-specific license review."
    },
    {
      "id": "cesium-ion",
      "name": "Cesium ion",
      "base_url": "https://cesium.com/platform/cesium-ion/",
      "provider": "cesium",
      "auth": "requires_credentials",
      "category": "tile_service",
      "discovery_strategy": "documentation",
      "capabilities": [
        "basemap_context"
      ],
      "municipality_name": null,
      "notes": "Cesium ion requires CESIUM_ION_TOKEN via environment variables for hosted terrain and 3D Tiles.",
      "status": "requires_credentials",
      "discovered_endpoints": [],
      "message": "Cesium ion requires CESIUM_ION_TOKEN via environment variables for hosted terrain and 3D Tiles."
    },
    {
      "id": "openstreetmap-api",
      "name": "OpenStreetMap API",
      "base_url": "https://wiki.openstreetmap.org/wiki/API",
      "provider": "openstreetmap",
      "auth": "public_metadata",
      "category": "basemap",
      "discovery_strategy": "public_api",
      "capabilities": [
        "basemap_context"
      ],
      "municipality_name": null,
      "notes": "Public OSM documentation. Production use must respect OSM tile and API usage policies.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Public OSM documentation. Production use must respect OSM tile and API usage policies."
    },
    {
      "id": "usgs-landsat",
      "name": "USGS Landsat Data",
      "base_url": "https://landsat.gsfc.nasa.gov/data/",
      "provider": "usgs",
      "auth": "public_metadata",
      "category": "satellite",
      "discovery_strategy": "public_portal",
      "capabilities": [
        "satellite_imagery"
      ],
      "municipality_name": null,
      "notes": "Landsat data portal documentation; exact API account requirements must be verified per product.",
      "status": "public_metadata",
      "discovered_endpoints": [],
      "message": "Landsat data portal documentation; exact API account requirements must be verified per product."
    },
    {
      "id": "adana-netcad-coverage-candidate",
      "name": "Adana İmar Portalı Adayı",
      "base_url": "https://keos.adana.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Adana",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "adiyaman-webgis-coverage-candidate",
      "name": "Adıyaman İmar Portalı Adayı",
      "base_url": "https://webgis.adiyaman.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Adıyaman",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "afyonkarahisar-ekent-coverage-candidate",
      "name": "Afyonkarahisar İmar Portalı Adayı",
      "base_url": "https://ekent.afyonkarahisar.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Afyonkarahisar",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "agri-municipal-coverage-candidate",
      "name": "Ağrı İmar Portalı Adayı",
      "base_url": "https://cbs.agri.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Ağrı",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "amasya-kbs-coverage-candidate",
      "name": "Amasya İmar Portalı Adayı",
      "base_url": "https://kbs.amasya.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Amasya",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "ankara-netcad-coverage-candidate",
      "name": "Ankara İmar Portalı Adayı",
      "base_url": "https://keos.ankara.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Ankara",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "antalya-webgis-coverage-candidate",
      "name": "Antalya İmar Portalı Adayı",
      "base_url": "https://webgis.antalya.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Antalya",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "artvin-ekent-coverage-candidate",
      "name": "Artvin İmar Portalı Adayı",
      "base_url": "https://ekent.artvin.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Artvin",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "aydin-municipal-coverage-candidate",
      "name": "Aydın İmar Portalı Adayı",
      "base_url": "https://cbs.aydin.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Aydın",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "balikesir-kbs-coverage-candidate",
      "name": "Balıkesir İmar Portalı Adayı",
      "base_url": "https://kbs.balikesir.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Balıkesir",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "bilecik-netcad-coverage-candidate",
      "name": "Bilecik İmar Portalı Adayı",
      "base_url": "https://keos.bilecik.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Bilecik",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "bingol-webgis-coverage-candidate",
      "name": "Bingöl İmar Portalı Adayı",
      "base_url": "https://webgis.bingol.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Bingöl",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "bitlis-ekent-coverage-candidate",
      "name": "Bitlis İmar Portalı Adayı",
      "base_url": "https://ekent.bitlis.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Bitlis",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "bolu-municipal-coverage-candidate",
      "name": "Bolu İmar Portalı Adayı",
      "base_url": "https://cbs.bolu.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Bolu",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "burdur-kbs-coverage-candidate",
      "name": "Burdur İmar Portalı Adayı",
      "base_url": "https://kbs.burdur.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Burdur",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "bursa-netcad-coverage-candidate",
      "name": "Bursa İmar Portalı Adayı",
      "base_url": "https://keos.bursa.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Bursa",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "canakkale-webgis-coverage-candidate",
      "name": "Çanakkale İmar Portalı Adayı",
      "base_url": "https://webgis.canakkale.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Çanakkale",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "cankiri-ekent-coverage-candidate",
      "name": "Çankırı İmar Portalı Adayı",
      "base_url": "https://ekent.cankiri.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Çankırı",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "corum-municipal-coverage-candidate",
      "name": "Çorum İmar Portalı Adayı",
      "base_url": "https://cbs.corum.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Çorum",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "denizli-kbs-coverage-candidate",
      "name": "Denizli İmar Portalı Adayı",
      "base_url": "https://kbs.denizli.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Denizli",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "diyarbakir-netcad-coverage-candidate",
      "name": "Diyarbakır İmar Portalı Adayı",
      "base_url": "https://keos.diyarbakir.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Diyarbakır",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "edirne-webgis-coverage-candidate",
      "name": "Edirne İmar Portalı Adayı",
      "base_url": "https://webgis.edirne.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Edirne",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "elazig-ekent-coverage-candidate",
      "name": "Elazığ İmar Portalı Adayı",
      "base_url": "https://ekent.elazig.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Elazığ",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "erzincan-municipal-coverage-candidate",
      "name": "Erzincan İmar Portalı Adayı",
      "base_url": "https://cbs.erzincan.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Erzincan",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "erzurum-kbs-coverage-candidate",
      "name": "Erzurum İmar Portalı Adayı",
      "base_url": "https://kbs.erzurum.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Erzurum",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "eskisehir-netcad-coverage-candidate",
      "name": "Eskişehir İmar Portalı Adayı",
      "base_url": "https://keos.eskisehir.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Eskişehir",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "gaziantep-webgis-coverage-candidate",
      "name": "Gaziantep İmar Portalı Adayı",
      "base_url": "https://webgis.gaziantep.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Gaziantep",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "giresun-ekent-coverage-candidate",
      "name": "Giresun İmar Portalı Adayı",
      "base_url": "https://ekent.giresun.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Giresun",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "gumushane-municipal-coverage-candidate",
      "name": "Gümüşhane İmar Portalı Adayı",
      "base_url": "https://cbs.gumushane.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Gümüşhane",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "hakkari-kbs-coverage-candidate",
      "name": "Hakkari İmar Portalı Adayı",
      "base_url": "https://kbs.hakkari.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Hakkari",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "hatay-netcad-coverage-candidate",
      "name": "Hatay İmar Portalı Adayı",
      "base_url": "https://keos.hatay.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Hatay",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "isparta-webgis-coverage-candidate",
      "name": "Isparta İmar Portalı Adayı",
      "base_url": "https://webgis.isparta.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Isparta",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "mersin-ekent-coverage-candidate",
      "name": "Mersin İmar Portalı Adayı",
      "base_url": "https://ekent.mersin.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Mersin",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "istanbul-municipal-coverage-candidate",
      "name": "İstanbul İmar Portalı Adayı",
      "base_url": "https://cbs.istanbul.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "İstanbul",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "izmir-kbs-coverage-candidate",
      "name": "İzmir İmar Portalı Adayı",
      "base_url": "https://kbs.izmir.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "İzmir",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kars-netcad-coverage-candidate",
      "name": "Kars İmar Portalı Adayı",
      "base_url": "https://keos.kars.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Kars",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kastamonu-webgis-coverage-candidate",
      "name": "Kastamonu İmar Portalı Adayı",
      "base_url": "https://webgis.kastamonu.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Kastamonu",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kayseri-ekent-coverage-candidate",
      "name": "Kayseri İmar Portalı Adayı",
      "base_url": "https://ekent.kayseri.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Kayseri",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kirklareli-municipal-coverage-candidate",
      "name": "Kırklareli İmar Portalı Adayı",
      "base_url": "https://cbs.kirklareli.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Kırklareli",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kirsehir-kbs-coverage-candidate",
      "name": "Kırşehir İmar Portalı Adayı",
      "base_url": "https://kbs.kirsehir.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Kırşehir",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kocaeli-netcad-coverage-candidate",
      "name": "Kocaeli İmar Portalı Adayı",
      "base_url": "https://keos.kocaeli.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Kocaeli",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "konya-webgis-coverage-candidate",
      "name": "Konya İmar Portalı Adayı",
      "base_url": "https://webgis.konya.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Konya",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kutahya-ekent-coverage-candidate",
      "name": "Kütahya İmar Portalı Adayı",
      "base_url": "https://ekent.kutahya.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Kütahya",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "malatya-municipal-coverage-candidate",
      "name": "Malatya İmar Portalı Adayı",
      "base_url": "https://cbs.malatya.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Malatya",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "manisa-kbs-coverage-candidate",
      "name": "Manisa İmar Portalı Adayı",
      "base_url": "https://kbs.manisa.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Manisa",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kahramanmaras-netcad-coverage-candidate",
      "name": "Kahramanmaraş İmar Portalı Adayı",
      "base_url": "https://keos.kahramanmaras.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Kahramanmaraş",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "mardin-webgis-coverage-candidate",
      "name": "Mardin İmar Portalı Adayı",
      "base_url": "https://webgis.mardin.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Mardin",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "mugla-ekent-coverage-candidate",
      "name": "Muğla İmar Portalı Adayı",
      "base_url": "https://ekent.mugla.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Muğla",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "mus-municipal-coverage-candidate",
      "name": "Muş İmar Portalı Adayı",
      "base_url": "https://cbs.mus.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Muş",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "nevsehir-kbs-coverage-candidate",
      "name": "Nevşehir İmar Portalı Adayı",
      "base_url": "https://kbs.nevsehir.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Nevşehir",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "nigde-netcad-coverage-candidate",
      "name": "Niğde İmar Portalı Adayı",
      "base_url": "https://keos.nigde.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Niğde",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "ordu-webgis-coverage-candidate",
      "name": "Ordu İmar Portalı Adayı",
      "base_url": "https://webgis.ordu.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Ordu",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "rize-ekent-coverage-candidate",
      "name": "Rize İmar Portalı Adayı",
      "base_url": "https://ekent.rize.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Rize",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "sakarya-municipal-coverage-candidate",
      "name": "Sakarya İmar Portalı Adayı",
      "base_url": "https://cbs.sakarya.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Sakarya",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "samsun-kbs-coverage-candidate",
      "name": "Samsun İmar Portalı Adayı",
      "base_url": "https://kbs.samsun.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Samsun",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "siirt-netcad-coverage-candidate",
      "name": "Siirt İmar Portalı Adayı",
      "base_url": "https://keos.siirt.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Siirt",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "sinop-webgis-coverage-candidate",
      "name": "Sinop İmar Portalı Adayı",
      "base_url": "https://webgis.sinop.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Sinop",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "sivas-ekent-coverage-candidate",
      "name": "Sivas İmar Portalı Adayı",
      "base_url": "https://ekent.sivas.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Sivas",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "tekirdag-municipal-coverage-candidate",
      "name": "Tekirdağ İmar Portalı Adayı",
      "base_url": "https://cbs.tekirdag.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Tekirdağ",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "tokat-kbs-coverage-candidate",
      "name": "Tokat İmar Portalı Adayı",
      "base_url": "https://kbs.tokat.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Tokat",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "trabzon-netcad-coverage-candidate",
      "name": "Trabzon İmar Portalı Adayı",
      "base_url": "https://keos.trabzon.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Trabzon",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "tunceli-webgis-coverage-candidate",
      "name": "Tunceli İmar Portalı Adayı",
      "base_url": "https://webgis.tunceli.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Tunceli",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "sanliurfa-ekent-coverage-candidate",
      "name": "Şanlıurfa İmar Portalı Adayı",
      "base_url": "https://ekent.sanliurfa.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Şanlıurfa",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "usak-municipal-coverage-candidate",
      "name": "Uşak İmar Portalı Adayı",
      "base_url": "https://cbs.usak.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Uşak",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "van-kbs-coverage-candidate",
      "name": "Van İmar Portalı Adayı",
      "base_url": "https://kbs.van.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Van",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "yozgat-netcad-coverage-candidate",
      "name": "Yozgat İmar Portalı Adayı",
      "base_url": "https://keos.yozgat.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Yozgat",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "zonguldak-webgis-coverage-candidate",
      "name": "Zonguldak İmar Portalı Adayı",
      "base_url": "https://webgis.zonguldak.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Zonguldak",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "aksaray-ekent-coverage-candidate",
      "name": "Aksaray İmar Portalı Adayı",
      "base_url": "https://ekent.aksaray.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Aksaray",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "bayburt-municipal-coverage-candidate",
      "name": "Bayburt İmar Portalı Adayı",
      "base_url": "https://cbs.bayburt.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Bayburt",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "karaman-kbs-coverage-candidate",
      "name": "Karaman İmar Portalı Adayı",
      "base_url": "https://kbs.karaman.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Karaman",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kirikkale-netcad-coverage-candidate",
      "name": "Kırıkkale İmar Portalı Adayı",
      "base_url": "https://keos.kirikkale.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Kırıkkale",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "batman-webgis-coverage-candidate",
      "name": "Batman İmar Portalı Adayı",
      "base_url": "https://webgis.batman.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Batman",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "sirnak-ekent-coverage-candidate",
      "name": "Şırnak İmar Portalı Adayı",
      "base_url": "https://ekent.sirnak.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Şırnak",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "bartin-municipal-coverage-candidate",
      "name": "Bartın İmar Portalı Adayı",
      "base_url": "https://cbs.bartin.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Bartın",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "ardahan-kbs-coverage-candidate",
      "name": "Ardahan İmar Portalı Adayı",
      "base_url": "https://kbs.ardahan.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Ardahan",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "igdir-netcad-coverage-candidate",
      "name": "Iğdır İmar Portalı Adayı",
      "base_url": "https://keos.igdir.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Iğdır",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "yalova-webgis-coverage-candidate",
      "name": "Yalova İmar Portalı Adayı",
      "base_url": "https://webgis.yalova.bel.tr/imardurumu/",
      "provider": "webgis",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis"
      ],
      "municipality_name": "Yalova",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "karabuk-ekent-coverage-candidate",
      "name": "Karabük İmar Portalı Adayı",
      "base_url": "https://ekent.karabuk.bel.tr/imardurumu/",
      "provider": "ekent",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "ekent"
      ],
      "municipality_name": "Karabük",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "kilis-municipal-coverage-candidate",
      "name": "Kilis İmar Portalı Adayı",
      "base_url": "https://cbs.kilis.bel.tr/",
      "provider": "municipal",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Kilis",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "osmaniye-kbs-coverage-candidate",
      "name": "Osmaniye İmar Portalı Adayı",
      "base_url": "https://kbs.osmaniye.bel.tr/",
      "provider": "kbs",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "municipal_gis",
        "zoning_status"
      ],
      "municipality_name": "Osmaniye",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    },
    {
      "id": "duzce-netcad-coverage-candidate",
      "name": "Düzce İmar Portalı Adayı",
      "base_url": "https://keos.duzce.bel.tr/imardurumu/",
      "provider": "netcad",
      "auth": "metadata_only",
      "category": "municipal_gis",
      "discovery_strategy": "metadata_only_candidate",
      "capabilities": [
        "zoning_status",
        "municipal_gis",
        "netcad_keos"
      ],
      "municipality_name": "Düzce",
      "notes": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.",
      "status": "metadata_only",
      "discovered_endpoints": [],
      "message": "Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified."
    }
  ]
};

export const FALLBACK_SOURCES_RESPONSE: SourcesResponse = {
  status: "fallback",
  message: "Backend erişilemediğinde güvenli yerel kaynak metadata görünümü.",
  total: FALLBACK_SOURCES.length,
  sources: FALLBACK_SOURCES
};

export function getFallbackSourceDetail(sourceId: string): SourceDetailResponse | null {
  const source = FALLBACK_SOURCES.find((entry) => entry.id === sourceId);
  const probe = FALLBACK_SOURCE_HEALTH.sources.find((entry) => entry.id === sourceId);
  if (!source || !probe) return null;
  return {
    status: "fallback",
    message: "Canlı probe backend bağlı değil; bu detay yerel metadata/provenance görünümüdür.",
    source,
    probe: {
      status: probe.status,
      discovered_endpoints: probe.discovered_endpoints,
      message: probe.message
    }
  };
}
