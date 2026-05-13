import { ConnectorKind } from '../connectors/connector.types';
import type { SourceAccessStatus, SourceCategory, SourceRegistryEntry, SourceJurisdiction } from './source-registry';

export interface TurkeyProvinceRecord {
  code: string;
  slug: string;
  name: string;
  region: string;
}

export interface TurkeyCoverageEntry extends SourceRegistryEntry {
  province?: string;
  district?: string;
  municipalitySlug?: string;
  vendor?: string;
  provenance?: string[];
  nextAction?: string;
  region?: string;
}

const municipalityNotes = 'Municipal source metadata derived from public homepage patterns or already-registered seed portals. Live probing must verify service availability and protection boundaries before ingestion.';
const nationalNotes = 'National or global metadata entry. Discovery must keep public metadata separate from live legal access and never fabricate parcel, zoning, or address results.';

export const TURKEY_PROVINCES: TurkeyProvinceRecord[] = [
  { code: '01', slug: 'adana', name: 'Adana', region: 'Akdeniz' },
  { code: '02', slug: 'adiyaman', name: 'Adıyaman', region: 'Güneydoğu Anadolu' },
  { code: '03', slug: 'afyonkarahisar', name: 'Afyonkarahisar', region: 'Ege' },
  { code: '04', slug: 'agri', name: 'Ağrı', region: 'Doğu Anadolu' },
  { code: '05', slug: 'amasya', name: 'Amasya', region: 'Karadeniz' },
  { code: '06', slug: 'ankara', name: 'Ankara', region: 'İç Anadolu' },
  { code: '07', slug: 'antalya', name: 'Antalya', region: 'Akdeniz' },
  { code: '08', slug: 'artvin', name: 'Artvin', region: 'Karadeniz' },
  { code: '09', slug: 'aydin', name: 'Aydın', region: 'Ege' },
  { code: '10', slug: 'balikesir', name: 'Balıkesir', region: 'Marmara' },
  { code: '11', slug: 'bilecik', name: 'Bilecik', region: 'Marmara' },
  { code: '12', slug: 'bingol', name: 'Bingöl', region: 'Doğu Anadolu' },
  { code: '13', slug: 'bitlis', name: 'Bitlis', region: 'Doğu Anadolu' },
  { code: '14', slug: 'bolu', name: 'Bolu', region: 'Karadeniz' },
  { code: '15', slug: 'burdur', name: 'Burdur', region: 'Akdeniz' },
  { code: '16', slug: 'bursa', name: 'Bursa', region: 'Marmara' },
  { code: '17', slug: 'canakkale', name: 'Çanakkale', region: 'Marmara' },
  { code: '18', slug: 'cankiri', name: 'Çankırı', region: 'Karadeniz' },
  { code: '19', slug: 'corum', name: 'Çorum', region: 'Karadeniz' },
  { code: '20', slug: 'denizli', name: 'Denizli', region: 'Ege' },
  { code: '21', slug: 'diyarbakir', name: 'Diyarbakır', region: 'Güneydoğu Anadolu' },
  { code: '22', slug: 'edirne', name: 'Edirne', region: 'Marmara' },
  { code: '23', slug: 'elazig', name: 'Elazığ', region: 'Doğu Anadolu' },
  { code: '24', slug: 'erzincan', name: 'Erzincan', region: 'Doğu Anadolu' },
  { code: '25', slug: 'erzurum', name: 'Erzurum', region: 'Doğu Anadolu' },
  { code: '26', slug: 'eskisehir', name: 'Eskişehir', region: 'İç Anadolu' },
  { code: '27', slug: 'gaziantep', name: 'Gaziantep', region: 'Güneydoğu Anadolu' },
  { code: '28', slug: 'giresun', name: 'Giresun', region: 'Karadeniz' },
  { code: '29', slug: 'gumushane', name: 'Gümüşhane', region: 'Karadeniz' },
  { code: '30', slug: 'hakkari', name: 'Hakkari', region: 'Doğu Anadolu' },
  { code: '31', slug: 'hatay', name: 'Hatay', region: 'Akdeniz' },
  { code: '32', slug: 'isparta', name: 'Isparta', region: 'Akdeniz' },
  { code: '33', slug: 'mersin', name: 'Mersin', region: 'Akdeniz' },
  { code: '34', slug: 'istanbul', name: 'İstanbul', region: 'Marmara' },
  { code: '35', slug: 'izmir', name: 'İzmir', region: 'Ege' },
  { code: '36', slug: 'kars', name: 'Kars', region: 'Doğu Anadolu' },
  { code: '37', slug: 'kastamonu', name: 'Kastamonu', region: 'Karadeniz' },
  { code: '38', slug: 'kayseri', name: 'Kayseri', region: 'İç Anadolu' },
  { code: '39', slug: 'kirklareli', name: 'Kırklareli', region: 'Marmara' },
  { code: '40', slug: 'kirsehir', name: 'Kırşehir', region: 'İç Anadolu' },
  { code: '41', slug: 'kocaeli', name: 'Kocaeli', region: 'Marmara' },
  { code: '42', slug: 'konya', name: 'Konya', region: 'İç Anadolu' },
  { code: '43', slug: 'kutahya', name: 'Kütahya', region: 'Ege' },
  { code: '44', slug: 'malatya', name: 'Malatya', region: 'Doğu Anadolu' },
  { code: '45', slug: 'manisa', name: 'Manisa', region: 'Ege' },
  { code: '46', slug: 'kahramanmaras', name: 'Kahramanmaraş', region: 'Akdeniz' },
  { code: '47', slug: 'mardin', name: 'Mardin', region: 'Güneydoğu Anadolu' },
  { code: '48', slug: 'mugla', name: 'Muğla', region: 'Ege' },
  { code: '49', slug: 'mus', name: 'Muş', region: 'Doğu Anadolu' },
  { code: '50', slug: 'nevsehir', name: 'Nevşehir', region: 'İç Anadolu' },
  { code: '51', slug: 'nigde', name: 'Niğde', region: 'İç Anadolu' },
  { code: '52', slug: 'ordu', name: 'Ordu', region: 'Karadeniz' },
  { code: '53', slug: 'rize', name: 'Rize', region: 'Karadeniz' },
  { code: '54', slug: 'sakarya', name: 'Sakarya', region: 'Marmara' },
  { code: '55', slug: 'samsun', name: 'Samsun', region: 'Karadeniz' },
  { code: '56', slug: 'siirt', name: 'Siirt', region: 'Güneydoğu Anadolu' },
  { code: '57', slug: 'sinop', name: 'Sinop', region: 'Karadeniz' },
  { code: '58', slug: 'sivas', name: 'Sivas', region: 'İç Anadolu' },
  { code: '59', slug: 'tekirdag', name: 'Tekirdağ', region: 'Marmara' },
  { code: '60', slug: 'tokat', name: 'Tokat', region: 'Karadeniz' },
  { code: '61', slug: 'trabzon', name: 'Trabzon', region: 'Karadeniz' },
  { code: '62', slug: 'tunceli', name: 'Tunceli', region: 'Doğu Anadolu' },
  { code: '63', slug: 'sanliurfa', name: 'Şanlıurfa', region: 'Güneydoğu Anadolu' },
  { code: '64', slug: 'usak', name: 'Uşak', region: 'Ege' },
  { code: '65', slug: 'van', name: 'Van', region: 'Doğu Anadolu' },
  { code: '66', slug: 'yozgat', name: 'Yozgat', region: 'İç Anadolu' },
  { code: '67', slug: 'zonguldak', name: 'Zonguldak', region: 'Karadeniz' },
  { code: '68', slug: 'aksaray', name: 'Aksaray', region: 'İç Anadolu' },
  { code: '69', slug: 'bayburt', name: 'Bayburt', region: 'Karadeniz' },
  { code: '70', slug: 'karaman', name: 'Karaman', region: 'İç Anadolu' },
  { code: '71', slug: 'kirikkale', name: 'Kırıkkale', region: 'İç Anadolu' },
  { code: '72', slug: 'batman', name: 'Batman', region: 'Güneydoğu Anadolu' },
  { code: '73', slug: 'sirnak', name: 'Şırnak', region: 'Güneydoğu Anadolu' },
  { code: '74', slug: 'bartin', name: 'Bartın', region: 'Karadeniz' },
  { code: '75', slug: 'ardahan', name: 'Ardahan', region: 'Doğu Anadolu' },
  { code: '76', slug: 'igdir', name: 'Iğdır', region: 'Doğu Anadolu' },
  { code: '77', slug: 'yalova', name: 'Yalova', region: 'Marmara' },
  { code: '78', slug: 'karabuk', name: 'Karabük', region: 'Karadeniz' },
  { code: '79', slug: 'kilis', name: 'Kilis', region: 'Güneydoğu Anadolu' },
  { code: '80', slug: 'osmaniye', name: 'Osmaniye', region: 'Akdeniz' },
  { code: '81', slug: 'duzce', name: 'Düzce', region: 'Karadeniz' }
];

export const NATIONAL_COVERAGE_SEEDS: TurkeyCoverageEntry[] = [
  {
    id: 'tkgm-parsel-sorgu',
    name: 'TKGM Parsel Sorgu',
    jurisdiction: 'national',
    category: 'parcel',
    homepageUrl: 'https://parselsorgu.tkgm.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'requires_legal_agreement', notes: 'Official parcel query portal; lawful automation, session, captcha, and data-sharing constraints must be verified at runtime.' },
    capabilities: ['parcel_lookup', 'parcel_geometry'],
    documentationUrls: ['https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar'],
    vendor: 'tkgm',
    provenance: ['official homepage', 'public metadata only; no parcel result claims'],
    nextAction: 'Verify legal access and protected-session handling before attempting any query flow.',
    region: 'Marmara'
  },
  {
    id: 'tkgm-data-sharing-docs',
    name: 'TKGM Veri Paylaşımı Usul ve Esasları',
    jurisdiction: 'national',
    category: 'parcel',
    homepageUrl: 'https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar',
    connectorKinds: [ConnectorKind.Documentation],
    access: { status: 'public_metadata', notes: 'Official legal documentation page for data-sharing rules; it is not a data API endpoint.' },
    capabilities: ['legal_reference'],
    vendor: 'tkgm',
    provenance: ['official legal documentation'],
    nextAction: 'Use this page as the legal reference before any protected data ingestion.',
    region: 'Marmara'
  },
  {
    id: 'eplan-csb',
    name: 'e-Plan ÇŞB',
    jurisdiction: 'national',
    category: 'plan',
    homepageUrl: 'https://eplan.csb.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'public_metadata', notes: 'Official e-Plan portal; public plan catalog and protected workflows must be separated by discovery.' },
    capabilities: ['plan_catalog', 'plan_lookup'],
    vendor: 'csb',
    provenance: ['official portal metadata'],
    nextAction: 'Probe public catalog metadata only; never assume the protected plan workflow is available.',
    region: 'Marmara'
  },
  {
    id: 'e-plan',
    name: 'e-Plan Portalı',
    jurisdiction: 'national',
    category: 'plan',
    homepageUrl: 'https://e-plan.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'public_metadata', notes: 'Legacy or alternate e-Plan hostname retained for discovery compatibility and canonical redirect checks.' },
    capabilities: ['plan_catalog'],
    vendor: 'csb',
    provenance: ['official portal metadata', 'redirect compatibility'],
    nextAction: 'Use for canonical redirect and public metadata checks only.',
    region: 'Marmara'
  },
  {
    id: 'tucbs-public-api',
    name: 'TUCBS Public API',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://tucbs-public-api.csb.gov.tr/',
    connectorKinds: [ConnectorKind.Ogc, ConnectorKind.PublicApi],
    access: { status: 'public_metadata', notes: nationalNotes },
    capabilities: ['wms', 'wfs', 'geospatial_api', 'plan_catalog'],
    vendor: 'csb',
    provenance: ['official public API landing page'],
    nextAction: 'Inspect only public OpenAPI/OGC metadata and keep protected credentials out of the registry.',
    region: 'Marmara'
  },
  {
    id: 'tucbs',
    name: 'TUCBS Ana Portal',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://tucbs.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'public_metadata', notes: 'National CBS portal and metadata entry point; exact service access is determined per catalog endpoint.' },
    capabilities: ['geospatial_catalog', 'wms', 'wfs'],
    vendor: 'csb',
    provenance: ['official portal metadata'],
    nextAction: 'Use as the portal entrypoint for catalog discovery and metadata harvesting.',
    region: 'Marmara'
  },
  {
    id: 'atlas',
    name: 'Atlas',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://www.atlas.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'public_metadata', notes: nationalNotes },
    capabilities: ['basemap_context', 'geospatial_catalog', 'wms'],
    vendor: 'csb',
    provenance: ['official portal metadata'],
    nextAction: 'Use Atlas for public basemap and catalog metadata only.',
    region: 'Marmara'
  },
  {
    id: 'csb-cbs',
    name: 'ÇŞB Coğrafi Bilgi Sistemleri',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://cbs.csb.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'public_metadata', notes: 'Official CBS portal; only public catalog metadata should be harvested without authenticated agreements.' },
    capabilities: ['geospatial_catalog', 'wms', 'wfs'],
    vendor: 'csb',
    provenance: ['official portal metadata'],
    nextAction: 'Harvest public catalog metadata only and separate any authenticated agreements.',
    region: 'Marmara'
  },
  {
    id: 'yerel-veri-platformlari',
    name: 'Yerel Veri Platformları',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://akillisehirler.csb.gov.tr/yerel-veri-platformlari/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'public_metadata', notes: 'Official local data platforms page; discovery should collect public metadata links only.' },
    capabilities: ['municipal_gis', 'geospatial_catalog'],
    vendor: 'csb',
    provenance: ['official platform catalogue'],
    nextAction: 'Use the page as a metadata hub for municipal platform links and not as a data API.',
    region: 'Marmara'
  },
  {
    id: 'bulutkbs',
    name: 'BulutKBS',
    jurisdiction: 'national',
    category: 'municipal_gis',
    homepageUrl: 'https://bulutkbs.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'metadata_only', notes: 'Public/institutional KBS portal; the registry only carries safe metadata and does not assert live endpoint availability.' },
    capabilities: ['municipal_gis', 'parcel_lookup'],
    vendor: 'bulutkbs',
    provenance: ['public portal metadata', 'metadata_only'],
    nextAction: 'Treat as a metadata reference until a live, authorized endpoint is verified.',
    region: 'Marmara'
  },
  {
    id: 'maks',
    name: 'MAKS',
    jurisdiction: 'national',
    category: 'address',
    homepageUrl: 'https://maks.nvi.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'requires_legal_agreement', notes: 'MAKS production integration requires official legal protocol and institutional credentials.' },
    capabilities: ['address_registry'],
    vendor: 'nvi',
    provenance: ['official system metadata'],
    nextAction: 'Require formal protocol and credentials before any production integration attempt.',
    region: 'Marmara'
  },
  {
    id: 'netcad-arazi-yonetimi',
    name: 'Netcad Arazi Yönetimi Referansı',
    jurisdiction: 'national',
    category: 'municipal_gis',
    homepageUrl: 'https://www.netcad.com/tr/cozumler/arazi-yonetimi#incele',
    connectorKinds: [ConnectorKind.Documentation],
    access: { status: 'public_metadata', notes: 'Vendor reference page for land management and Netcad implementation patterns; not a municipal data source.' },
    capabilities: ['netcad_keos', 'municipal_gis'],
    vendor: 'netcad',
    provenance: ['vendor documentation'],
    nextAction: 'Use only as a product/vendor pattern reference.',
    region: 'Marmara'
  },
  {
    id: 'netcad-netgis-server',
    name: 'Netcad NetGIS Server',
    jurisdiction: 'national',
    category: 'municipal_gis',
    homepageUrl: 'https://www.netcad.com/netgis-server',
    connectorKinds: [ConnectorKind.Documentation],
    access: { status: 'public_metadata', notes: 'Vendor documentation and fingerprint reference for NetGIS/KEOS patterns; not itself a parcel data source.' },
    capabilities: ['netcad_keos', 'municipal_gis'],
    vendor: 'netcad',
    provenance: ['vendor documentation'],
    nextAction: 'Use for service fingerprinting and connector pattern matching only.',
    region: 'Marmara'
  },
  {
    id: 'copernicus-data-space',
    name: 'Copernicus Data Space Ecosystem',
    jurisdiction: 'global',
    category: 'satellite',
    homepageUrl: 'https://dataspace.copernicus.eu/',
    connectorKinds: [ConnectorKind.PublicApi],
    access: { status: 'requires_credentials', notes: 'Sentinel data APIs can require official account or OAuth; no tokens are stored in registry metadata.' },
    capabilities: ['satellite_imagery'],
    vendor: 'copernicus',
    provenance: ['official data space metadata'],
    nextAction: 'Keep authentication and token handling outside the registry.',
    region: 'Marmara'
  },
  {
    id: 'esri-world-imagery',
    name: 'Esri World Imagery',
    jurisdiction: 'global',
    category: 'basemap',
    homepageUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    connectorKinds: [ConnectorKind.ArcgisRest],
    access: { status: 'public_metadata', notes: 'Public ArcGIS REST imagery endpoint; production usage must follow Esri terms and live service metadata.' },
    capabilities: ['arcgis_rest', 'basemap_context'],
    vendor: 'esri',
    provenance: ['public ArcGIS REST metadata'],
    nextAction: 'Use only for basemap context and terms-compliant access checks.',
    region: 'Marmara'
  },
  {
    id: 'mapbox-maps-api',
    name: 'Mapbox Maps API',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://docs.mapbox.com/api/maps/',
    connectorKinds: [ConnectorKind.Documentation],
    access: { status: 'requires_credentials', notes: 'Commercial map API requires MAPBOX_ACCESS_TOKEN via environment variables and terms-compliant use.' },
    capabilities: ['basemap_context'],
    vendor: 'mapbox',
    provenance: ['vendor documentation'],
    nextAction: 'Load the access token from environment variables and keep it out of source control.',
    region: 'Marmara'
  },
  {
    id: 'maptiler-cloud-api',
    name: 'MapTiler Cloud API',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://docs.maptiler.com/cloud/api/',
    connectorKinds: [ConnectorKind.Documentation],
    access: { status: 'requires_credentials', notes: 'Commercial map API requires MAPTILER_API_KEY via environment variables and terms-compliant use.' },
    capabilities: ['basemap_context'],
    vendor: 'maptiler',
    provenance: ['vendor documentation'],
    nextAction: 'Require a configured MAPTILER_API_KEY before any tile request is attempted.',
    region: 'Marmara'
  },
  {
    id: 'here-map-tile-api',
    name: 'HERE APIs',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://developer.here.com/documentation',
    connectorKinds: [ConnectorKind.Documentation],
    access: { status: 'requires_credentials', notes: 'HERE APIs require HERE_API_KEY via environment variables and product-specific license review.' },
    capabilities: ['basemap_context'],
    vendor: 'here',
    provenance: ['vendor documentation'],
    nextAction: 'Keep HERE usage behind configured credentials and license review.',
    region: 'Marmara'
  },
  {
    id: 'cesium-ion',
    name: 'Cesium ion',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://cesium.com/platform/cesium-ion/',
    connectorKinds: [ConnectorKind.Documentation],
    access: { status: 'requires_credentials', notes: 'Cesium ion requires CESIUM_ION_TOKEN via environment variables for hosted terrain and 3D Tiles.' },
    capabilities: ['basemap_context'],
    vendor: 'cesium',
    provenance: ['vendor documentation'],
    nextAction: 'Keep terrain and 3D Tiles behind a configured Cesium token.',
    region: 'Marmara'
  },
  {
    id: 'openstreetmap-api',
    name: 'OpenStreetMap API',
    jurisdiction: 'global',
    category: 'basemap',
    homepageUrl: 'https://wiki.openstreetmap.org/wiki/API',
    connectorKinds: [ConnectorKind.PublicApi],
    access: { status: 'public_metadata', notes: 'Public OSM documentation. Production use must respect OSM tile and API usage policies.' },
    capabilities: ['basemap_context'],
    vendor: 'openstreetmap',
    provenance: ['public documentation'],
    nextAction: 'Respect OSM usage policies and treat this as public metadata, not a bulk data license.',
    region: 'Marmara'
  },
  {
    id: 'usgs-landsat',
    name: 'USGS Landsat Data',
    jurisdiction: 'global',
    category: 'satellite',
    homepageUrl: 'https://landsat.gsfc.nasa.gov/data/',
    connectorKinds: [ConnectorKind.PublicPortal],
    access: { status: 'public_metadata', notes: 'Landsat data portal documentation; exact API account requirements must be verified per product.' },
    capabilities: ['satellite_imagery'],
    vendor: 'usgs',
    provenance: ['public data portal metadata'],
    nextAction: 'Use as a public imagery reference and confirm exact product/API requirements separately.',
    region: 'Marmara'
  }
];

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function vendorTemplate(vendor: string, slug: string): { homepageUrl: string; connectorKinds: ConnectorKind[]; capabilities: string[] } {
  switch (vendor) {
    case 'netcad':
      return { homepageUrl: `https://keos.${slug}.bel.tr/imardurumu/`, connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal], capabilities: ['zoning_status', 'municipal_gis', 'netcad_keos'] };
    case 'webgis':
      return { homepageUrl: `https://webgis.${slug}.bel.tr/imardurumu/`, connectorKinds: [ConnectorKind.MunicipalPortal], capabilities: ['zoning_status', 'municipal_gis'] };
    case 'ekent':
      return { homepageUrl: `https://ekent.${slug}.bel.tr/imardurumu/`, connectorKinds: [ConnectorKind.Ekent, ConnectorKind.MunicipalPortal], capabilities: ['zoning_status', 'municipal_gis', 'ekent'] };
    case 'kbs':
      return { homepageUrl: `https://kbs.${slug}.bel.tr/`, connectorKinds: [ConnectorKind.MunicipalPortal], capabilities: ['municipal_gis', 'zoning_status'] };
    default:
      return { homepageUrl: `https://cbs.${slug}.bel.tr/`, connectorKinds: [ConnectorKind.MunicipalPortal], capabilities: ['municipal_gis', 'zoning_status'] };
  }
}

export function buildTurkeyMunicipalCoverageCandidates(): TurkeyCoverageEntry[] {
  const vendors = ['netcad', 'webgis', 'ekent', 'municipal', 'kbs'] as const;
  return TURKEY_PROVINCES.map((province, index) => {
    const vendor = vendors[index % vendors.length];
    const template = vendorTemplate(vendor, province.slug);
    const slug = `${province.slug}-${vendor}-coverage-candidate`;
    return {
      id: slug,
      name: `${province.name} İmar Portalı Adayı`,
      jurisdiction: 'municipal',
      category: 'municipal_gis',
      homepageUrl: template.homepageUrl,
      connectorKinds: template.connectorKinds,
      access: {
        status: 'metadata_only',
        notes: 'Pattern-derived municipal coverage candidate; homepage and service endpoints are not yet verified.'
      },
      capabilities: template.capabilities,
      province: province.name,
      district: province.name,
      municipalitySlug: province.slug,
      vendor,
      metadata: {
        province: province.name,
        district: province.name,
        municipalitySlug: province.slug,
        vendor
      },
      provenance: [
        'pattern-derived from observed municipal Netcad/WebGIS/eKent/KBS portal conventions',
        'metadata_only candidate; live endpoint not verified'
      ],
      nextAction: 'Verify the homepage, run a public health probe, and stop if captcha or credentials are required.',
      region: province.region
    };
  });
}

export const TURKEY_MUNICIPAL_COVERAGE_CANDIDATES = buildTurkeyMunicipalCoverageCandidates();

export const TURKEY_COVERAGE_DATASET: TurkeyCoverageEntry[] = [...NATIONAL_COVERAGE_SEEDS, ...TURKEY_MUNICIPAL_COVERAGE_CANDIDATES];

export function provinceRegionBySlug(slug: string): string | undefined {
  return TURKEY_PROVINCES.find((province) => province.slug === slug)?.region;
}

export function provinceNameBySlug(slug: string): string | undefined {
  return TURKEY_PROVINCES.find((province) => province.slug === slug)?.name;
}

export function provinceCodeBySlug(slug: string): string | undefined {
  return TURKEY_PROVINCES.find((province) => province.slug === slug)?.code;
}

export function provinceSlugFromName(name: string): string | undefined {
  return TURKEY_PROVINCES.find((province) => province.name === name)?.slug;
}

