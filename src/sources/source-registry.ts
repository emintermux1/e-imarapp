import { ConnectorKind } from '../connectors/connector.types';
import { TURKEY_MUNICIPAL_COVERAGE_CANDIDATES } from './turkey-coverage';

export type SourceAccessStatus = 'public' | 'public_metadata' | 'metadata_only' | 'unknown' | 'requires_credentials' | 'requires_legal_agreement';
export type SourceJurisdiction = 'national' | 'municipal' | 'global';
export type SourceCategory = 'parcel' | 'plan' | 'municipal_gis' | 'open_data' | 'basemap' | 'satellite' | 'tile_service' | 'address';

export interface SourceRegistryEntry {
  id: string;
  name: string;
  jurisdiction: SourceJurisdiction;
  category: SourceCategory;
  homepageUrl: string;
  connectorKinds: ConnectorKind[];
  access: { status: SourceAccessStatus; notes: string };
  capabilities: string[];
  documentationUrls?: string[];
  metadata?: {
    province?: string;
    district?: string;
    municipalitySlug?: string;
    vendor?: string;
  };
}

const municipalNotes = 'Municipal public portal seed. Live probing determines endpoint health, legal terms, and whether captcha/session protection is present.';
const nationalNotes = 'Official public metadata entry. Connector discovery must verify live service availability and protected boundaries before ingestion.';

export const SOURCE_REGISTRY: SourceRegistryEntry[] = [
  {
    id: 'tkgm-parsel-sorgu', name: 'TKGM Parsel Sorgu Uygulaması', jurisdiction: 'national', category: 'parcel', homepageUrl: 'https://parselsorgu.tkgm.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'requires_legal_agreement', notes: 'Official parcel query portal; lawful automation, session, captcha, and data-sharing constraints must be verified at runtime.' },
    capabilities: ['parcel_lookup', 'municipal_gis'], documentationUrls: ['https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar']
  },
  {
    id: 'tkgm-data-sharing-rules', name: 'TKGM Veri Paylaşımı Usul ve Esasları', jurisdiction: 'national', category: 'parcel', homepageUrl: 'https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar',
    connectorKinds: [ConnectorKind.Documentation], access: { status: 'public_metadata', notes: 'Official legal documentation page for data-sharing rules; it is not a data API endpoint.' }, capabilities: ['legal_reference']
  },
  {
    id: 'csb-e-plan', name: 'ÇŞİDB E-Plan Güncel', jurisdiction: 'national', category: 'plan', homepageUrl: 'https://eplan.csb.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'unknown', notes: 'Official e-Plan portal; public plan catalog and protected workflows must be separated by discovery.' }, capabilities: ['plan_catalog', 'plan_lookup'], documentationUrls: ['https://e-plan.gov.tr/']
  },
  {
    id: 'e-plan', name: 'E-Plan Portalı', jurisdiction: 'national', category: 'plan', homepageUrl: 'https://e-plan.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'unknown', notes: 'Legacy e-Plan hostname retained for compatibility and canonical redirect checks.' }, capabilities: ['plan_catalog']
  },
  {
    id: 'csb-e-plan-legacy', name: 'ÇŞİDB E-Plan Legacy/Alternatif', jurisdiction: 'national', category: 'plan', homepageUrl: 'https://e-plan.gov.tr/',
    connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'unknown', notes: 'Legacy or alternate e-Plan hostname retained for discovery compatibility and canonical redirect checks.' }, capabilities: ['plan_catalog']
  },
  { id: 'tucbs-public-api', name: 'Türkiye Ulusal CBS Public API', jurisdiction: 'national', category: 'open_data', homepageUrl: 'https://tucbs-public-api.csb.gov.tr/', connectorKinds: [ConnectorKind.Ogc, ConnectorKind.PublicApi], access: { status: 'unknown', notes: nationalNotes }, capabilities: ['wms', 'wfs', 'geospatial_api', 'plan_catalog'], documentationUrls: ['https://tucbs.gov.tr/'] },
  { id: 'tucbs-ana', name: 'Türkiye Ulusal CBS Ana Portal', jurisdiction: 'national', category: 'open_data', homepageUrl: 'https://tucbs.gov.tr/', connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'public_metadata', notes: 'National CBS portal and metadata entry point; exact service access is determined per catalog endpoint.' }, capabilities: ['geospatial_catalog', 'wms', 'wfs'] },
  { id: 'edevlet-csb-tucbs', name: 'e-Devlet ÇŞİDB TUCBS Hizmeti', jurisdiction: 'national', category: 'open_data', homepageUrl: 'https://www.turkiye.gov.tr/csb-tucbs-8514', connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'requires_credentials', notes: 'e-Devlet workflow requires authenticated legal access; credentials are not stored in this repository.' }, capabilities: ['authenticated_service_catalog', 'tucbs_access'] },
  { id: 'atlas-ulusal-cbs', name: 'Atlas Ulusal CBS', jurisdiction: 'national', category: 'basemap', homepageUrl: 'https://www.atlas.gov.tr/', connectorKinds: [ConnectorKind.Ogc, ConnectorKind.PublicPortal], access: { status: 'unknown', notes: nationalNotes }, capabilities: ['basemap_context', 'geospatial_catalog', 'wms'] },
  { id: 'csb-cbs', name: 'ÇŞB Coğrafi Bilgi Sistemleri', jurisdiction: 'national', category: 'open_data', homepageUrl: 'https://cbs.csb.gov.tr/', connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'public_metadata', notes: 'Official CBS portal; only public catalog metadata should be harvested without authenticated agreements.' }, capabilities: ['geospatial_catalog', 'wms', 'wfs'] },
  { id: 'akilli-sehirler-yerel-veri', name: 'Akıllı Şehirler Yerel Veri Platformları', jurisdiction: 'national', category: 'open_data', homepageUrl: 'https://akillisehirler.csb.gov.tr/yerel-veri-platformlari/', connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'public_metadata', notes: 'Official local data platforms page; discovery should collect public metadata links only.' }, capabilities: ['municipal_gis', 'geospatial_catalog'] },
  { id: 'bulutkbs', name: 'BulutKBS', jurisdiction: 'national', category: 'municipal_gis', homepageUrl: 'https://bulutkbs.gov.tr/', connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'unknown', notes: 'Public/institutional KBS portal; connector must separate public views from protected flows.' }, capabilities: ['municipal_gis', 'parcel_lookup'] },
  { id: 'maks', name: 'Mekansal Adres Kayıt Sistemi', jurisdiction: 'national', category: 'address', homepageUrl: 'https://maks.nvi.gov.tr/', connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'requires_legal_agreement', notes: 'MAKS production integration requires official legal protocol and institutional credentials.' }, capabilities: ['address_registry'] },
  { id: 'netcad-arazi-yonetimi', name: 'Netcad Arazi Yönetimi Referansı', jurisdiction: 'national', category: 'municipal_gis', homepageUrl: 'https://www.netcad.com/tr/cozumler/arazi-yonetimi#incele', connectorKinds: [ConnectorKind.Documentation], access: { status: 'public_metadata', notes: 'Vendor reference page for land management and Netcad implementation patterns; not a municipal data source.' }, capabilities: ['netcad_keos', 'municipal_gis'] },
  { id: 'netcad-netgis-server', name: 'Netcad NetGIS Server', jurisdiction: 'national', category: 'municipal_gis', homepageUrl: 'https://www.netcad.com/netgis-server', connectorKinds: [ConnectorKind.Documentation], access: { status: 'public_metadata', notes: 'Vendor documentation and fingerprint reference for NetGIS/KEOS patterns; not itself a parcel data source.' }, capabilities: ['netcad_keos', 'municipal_gis'] },
  { id: 'copernicus-data-space', name: 'Copernicus Data Space Ecosystem', jurisdiction: 'global', category: 'satellite', homepageUrl: 'https://dataspace.copernicus.eu/', connectorKinds: [ConnectorKind.PublicApi], access: { status: 'requires_credentials', notes: 'Sentinel data APIs can require official account or OAuth; no tokens are stored in registry metadata.' }, capabilities: ['satellite_imagery'] },
  { id: 'esri-world-imagery', name: 'Esri World Imagery MapServer', jurisdiction: 'global', category: 'basemap', homepageUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', connectorKinds: [ConnectorKind.ArcgisRest], access: { status: 'unknown', notes: 'Public ArcGIS REST imagery endpoint; production usage must follow Esri terms and live service metadata.' }, capabilities: ['arcgis_rest', 'basemap_context'] },
  { id: 'mapbox-maps-api', name: 'Mapbox Maps API', jurisdiction: 'global', category: 'tile_service', homepageUrl: 'https://docs.mapbox.com/api/maps/', connectorKinds: [ConnectorKind.Documentation], access: { status: 'requires_credentials', notes: 'Commercial map API requires MAPBOX_ACCESS_TOKEN via environment variables and terms-compliant use.' }, capabilities: ['basemap_context'] },
  { id: 'maptiler-cloud-api', name: 'MapTiler Cloud API', jurisdiction: 'global', category: 'tile_service', homepageUrl: 'https://docs.maptiler.com/cloud/api/', connectorKinds: [ConnectorKind.Documentation], access: { status: 'requires_credentials', notes: 'Commercial map API requires MAPTILER_API_KEY via environment variables and terms-compliant use.' }, capabilities: ['basemap_context'] },
  { id: 'here-map-tile-api', name: 'HERE APIs', jurisdiction: 'global', category: 'tile_service', homepageUrl: 'https://developer.here.com/documentation', connectorKinds: [ConnectorKind.Documentation], access: { status: 'requires_credentials', notes: 'HERE APIs require HERE_API_KEY via environment variables and product-specific license review.' }, capabilities: ['basemap_context'] },
  { id: 'cesium-ion', name: 'Cesium ion', jurisdiction: 'global', category: 'tile_service', homepageUrl: 'https://cesium.com/platform/cesium-ion/', connectorKinds: [ConnectorKind.Documentation], access: { status: 'requires_credentials', notes: 'Cesium ion requires CESIUM_ION_TOKEN via environment variables for hosted terrain and 3D Tiles.' }, capabilities: ['basemap_context'] },
  { id: 'openstreetmap-api', name: 'OpenStreetMap API', jurisdiction: 'global', category: 'basemap', homepageUrl: 'https://wiki.openstreetmap.org/wiki/API', connectorKinds: [ConnectorKind.PublicApi], access: { status: 'public_metadata', notes: 'Public OSM documentation. Production use must respect OSM tile and API usage policies.' }, capabilities: ['basemap_context'] },
  { id: 'usgs-landsat', name: 'USGS Landsat Data', jurisdiction: 'global', category: 'satellite', homepageUrl: 'https://landsat.gsfc.nasa.gov/data/', connectorKinds: [ConnectorKind.PublicPortal], access: { status: 'unknown', notes: 'Landsat data portal documentation; exact API account requirements must be verified per product.' }, capabilities: ['satellite_imagery'] },
  ...municipalSources(),
  ...generatedTurkeyMunicipalCoverage()
];

function generatedTurkeyMunicipalCoverage(): SourceRegistryEntry[] {
  return TURKEY_MUNICIPAL_COVERAGE_CANDIDATES.map((source) => ({
    id: source.id,
    name: source.name,
    jurisdiction: source.jurisdiction,
    category: source.category,
    homepageUrl: source.homepageUrl,
    connectorKinds: source.connectorKinds,
    access: { status: source.access.status, notes: source.access.notes },
    capabilities: source.capabilities,
    documentationUrls: source.documentationUrls,
    metadata: {
      province: source.province,
      district: source.district,
      municipalitySlug: source.municipalitySlug,
      vendor: source.vendor
    }
  }));
}

function municipalSources(): SourceRegistryEntry[] {
  const rows: Array<[string, string, string, string, string, string?, string?]> = [
    ['pendik-keos-imar', 'Pendik Belediyesi KEOS İmar Durumu', 'https://keos.pendik.bel.tr/imardurumu/', 'İstanbul', 'Pendik', 'pendik', 'netcad'],
    ['esenler-keos-imar', 'Esenler Belediyesi KEOS İmar Durumu', 'https://keos.esenler.bel.tr/imardurumu/index.aspx', 'İstanbul', 'Esenler', 'esenler', 'netcad'],
    ['canakkale-webgis-imar', 'Çanakkale Belediyesi WebGIS İmar Durumu', 'https://webgis.canakkale.bel.tr/imardurumu/index.aspx', 'Çanakkale', 'Merkez', 'canakkale', 'netcad'],
    ['pamukkale-keos-imar', 'Pamukkale Belediyesi KEOS İmar Durumu', 'http://keos.pamukkale.bel.tr/imardurumu/index.aspx', 'Denizli', 'Pamukkale', 'pamukkale', 'netcad'],
    ['cerkezkoy-webgis-imar', 'Çerkezköy Belediyesi WebGIS İmar Durumu', 'https://webgis.cerkezkoy.bel.tr:444/imardurumu/', 'Tekirdağ', 'Çerkezköy', 'cerkezkoy', 'netcad'],
    ['kahramankazan-keos-imar', 'Kahramankazan Belediyesi KEOS İmar Durumu', 'https://keos.kahramankazan.bel.tr:8880/imardurumu/', 'Ankara', 'Kahramankazan', 'kahramankazan', 'netcad'],
    ['alanya-keos-imar', 'Alanya Belediyesi KEOS İmar Durumu', 'https://keos.alanya.bel.tr/imardurumu/index.aspx', 'Antalya', 'Alanya', 'alanya', 'netcad'],
    ['konak-keos-imar', 'Konak Belediyesi KEOS İmar Durumu', 'https://keos.konak.bel.tr/imardurumu/', 'İzmir', 'Konak', 'konak', 'netcad'],
    ['merkezefendi-keos-imar', 'Merkezefendi Belediyesi KEOS İmar Durumu', 'https://keos.merkezefendi.bel.tr/imardurumu/index.aspx', 'Denizli', 'Merkezefendi', 'merkezefendi', 'netcad'],
    ['altinordu-ekent-imar', 'Altınordu Belediyesi eKent İmar Durumu', 'https://ekent.altinordu.bel.tr/imardurumu/', 'Ordu', 'Altınordu', 'altinordu', 'ekent'],
    ['aksaray-ebelediye-imar', 'Aksaray Belediyesi e-Belediye İmar Durumu', 'https://ebelediye.aksaray.bel.tr:444/imardurumu/', 'Aksaray', 'Merkez', 'aksaray', 'ekent'],
    ['sehitkamil-keos-imar', 'Şehitkamil Belediyesi KEOS İmar Durumu', 'https://keos.sehitkamil.bel.tr/imardurumu/', 'Gaziantep', 'Şehitkamil', 'sehitkamil', 'netcad'],
    ['cankaya-imar-durumu', 'Çankaya Belediyesi İmar Durumu', 'https://imardurumu.cankaya.bel.tr/', 'Ankara', 'Çankaya', 'cankaya', 'municipal'],
    ['sultangazi-webgis-imar', 'Sultangazi Belediyesi WebGIS İmar Durumu', 'https://webgis.sultangazi.bel.tr/imardurumu/', 'İstanbul', 'Sultangazi', 'sultangazi', 'netcad'],
    ['basaksehir-webgis-imar', 'Başakşehir Belediyesi WebGIS İmar Durumu', 'https://webgis.basaksehir.bel.tr/imardurumu/', 'İstanbul', 'Başakşehir', 'basaksehir', 'netcad'],
    ['ibb-sehir-haritasi', 'İBB Şehir Haritası', 'https://sehirharitasi.ibb.gov.tr', 'İstanbul', 'Büyükşehir', 'ibb', 'municipal'],
    ['ankara-imar', 'Ankara Büyükşehir Belediyesi İmar', 'https://imar.ankara.bel.tr', 'Ankara', 'Büyükşehir', 'ankara', 'municipal'],
    ['izmir-cbs', 'İzmir Büyükşehir Belediyesi CBS', 'https://cbs.izmir.bel.tr', 'İzmir', 'Büyükşehir', 'izmir', 'municipal'],
    ['tusba-keos-imar', 'Tuşba Belediyesi KEOS İmar Durumu', 'https://keos.tusba.bel.tr:8282/imardurumu/index.aspx', 'Van', 'Tuşba', 'tusba', 'netcad'],
    ['suleymanpasa-keos-imar', 'Süleymanpaşa Belediyesi KEOS İmar Durumu', 'https://keos.suleymanpasa.bel.tr:8080/imardurumu/index.aspx', 'Tekirdağ', 'Süleymanpaşa', 'suleymanpasa', 'netcad'],
    ['mustafakemalpasa-keos-imar', 'Mustafakemalpaşa Belediyesi KEOS İmar Durumu', 'http://keos.mustafakemalpasa.bel.tr/imardurumu/index.aspx', 'Bursa', 'Mustafakemalpaşa', 'mustafakemalpasa', 'netcad'],
    ['gelibolu-keos-imar', 'Gelibolu Belediyesi KEOS İmar Durumu', 'https://keos.gelibolu.bel.tr/imardurumu/', 'Çanakkale', 'Gelibolu', 'gelibolu', 'netcad'],
    ['caycuma-keos', 'Çaycuma Belediyesi KEOS', 'https://keos.caycuma.bel.tr/', 'Zonguldak', 'Çaycuma', 'caycuma', 'netcad'],
    ['kecioren-kbs', 'Keçiören Belediyesi KBS', 'https://kbs.kecioren.bel.tr/', 'Ankara', 'Keçiören', 'kecioren', 'municipal'],
    ['besiktas-keos-imar', 'Beşiktaş Belediyesi KEOS İmar Durumu', 'https://keos.besiktas.bel.tr/imardurumu/', 'İstanbul', 'Beşiktaş', 'besiktas', 'netcad'],
    ['bakirkoy-keos-imar', 'Bakırköy Belediyesi KEOS İmar Durumu', 'https://keos.bakirkoy.bel.tr/imardurumu/', 'İstanbul', 'Bakırköy', 'bakirkoy', 'netcad'],
    ['kadikoy-webgis-imar', 'Kadıköy Belediyesi WebGIS İmar Durumu', 'https://webgis.kadikoy.bel.tr/imardurumu/', 'İstanbul', 'Kadıköy', 'kadikoy', 'netcad'],
    ['gaziosmanpasa-keos', 'Gaziosmanpaşa Belediyesi KEOS', 'https://keos.gaziosmanpasa.bel.tr/keos/', 'İstanbul', 'Gaziosmanpaşa', 'gaziosmanpasa', 'netcad'],
    ['bodrum-keos-imar', 'Bodrum Belediyesi KEOS İmar Durumu', 'https://keos.bodrum.bel.tr/imardurumu/', 'Muğla', 'Bodrum', 'bodrum', 'netcad'],
    ['karsiyaka-keos-imar', 'Karşıyaka Belediyesi KEOS İmar Durumu', 'https://keos.karsiyaka.bel.tr/imardurumu/index.aspx', 'İzmir', 'Karşıyaka', 'karsiyaka', 'netcad'],
    ['nilufer-webgis-imar', 'Nilüfer Belediyesi WebGIS İmar Durumu', 'https://webgis.nilufer.bel.tr/imardurumu/', 'Bursa', 'Nilüfer', 'nilufer', 'netcad']
  ];

  const connectorKindsForVendor = (vendor?: string) => {
    if (vendor === 'ekent') return [ConnectorKind.Ekent, ConnectorKind.MunicipalPortal];
    if (vendor === 'netcad') return [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal];
    return [ConnectorKind.MunicipalPortal];
  };

  const capabilitiesForVendor = (vendor?: string) => {
    if (vendor === 'ekent') return ['zoning_status', 'municipal_gis', 'ekent'];
    if (vendor === 'netcad') return ['zoning_status', 'municipal_gis', 'netcad_keos'];
    return ['zoning_status', 'municipal_gis'];
  };

  return rows.map(([id, name, homepageUrl, province, district, municipalitySlug, vendor]) => ({
    id,
    name,
    jurisdiction: 'municipal' as const,
    category: 'municipal_gis' as const,
    homepageUrl,
    connectorKinds: connectorKindsForVendor(vendor),
    access: { status: 'unknown' as const, notes: municipalNotes },
    capabilities: capabilitiesForVendor(vendor),
    metadata: { province, district, municipalitySlug, vendor }
  }));
}
