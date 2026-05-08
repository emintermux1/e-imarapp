import { AccessStatus, ConnectorKind, SourceMetadata } from '../connectors/connector.types';

export const SOURCE_REGISTRY: readonly SourceMetadata[] = [
  {
    id: 'tkgm-parsel-sorgu',
    name: 'TKGM Parsel Sorgu Uygulaması',
    jurisdiction: 'national',
    category: 'parcel',
    homepageUrl: 'https://parselsorgu.tkgm.gov.tr/',
    connectorKinds: [ConnectorKind.NationalPortal],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Official parcel query portal. Automated access must comply with TKGM data sharing rules and runtime checks may require session/captcha handling.'
    },
    capabilities: ['parcel_lookup', 'map_portal'],
    documentationUrls: [
      'https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar'
    ]
  },
  {
    id: 'csb-e-plan',
    name: 'ÇŞİDB E-Plan Otomasyonu',
    jurisdiction: 'national',
    category: 'plan',
    homepageUrl: 'https://e-plan.gov.tr/',
    connectorKinds: [ConnectorKind.NationalPortal],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Official planning portal. Connector must verify public endpoints and request credentials when protected flows are encountered.'
    },
    capabilities: ['plan_lookup', 'plan_documents'],
    documentationUrls: ['https://eplan.csb.gov.tr/']
  },
  {
    id: 'tucbs-public-api',
    name: 'Türkiye Ulusal CBS Public API',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://tucbs-public-api.csb.gov.tr/',
    connectorKinds: [ConnectorKind.OpenData],
    access: {
      status: AccessStatus.Unknown,
      notes: 'National geospatial API endpoint. Runtime discovery records exact API availability and auth requirements.'
    },
    capabilities: ['geospatial_api', 'national_catalog'],
    documentationUrls: ['https://tucbs.gov.tr/']
  },
  {
    id: 'maks',
    name: 'Mekansal Adres Kayıt Sistemi',
    jurisdiction: 'national',
    category: 'address',
    homepageUrl: 'https://maks.nvi.gov.tr/',
    connectorKinds: [ConnectorKind.NationalPortal],
    access: {
      status: AccessStatus.RequiresLegalAgreement,
      notes: 'Official address registry system; production integration requires legal/credential review.'
    },
    capabilities: ['address_registry']
  },
  {
    id: 'hgm-atlas',
    name: 'Harita Genel Müdürlüğü Atlas',
    jurisdiction: 'national',
    category: 'basemap',
    homepageUrl: 'https://atlas.hgm.gov.tr/',
    connectorKinds: [ConnectorKind.Basemap],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Official basemap portal; tile/service use must be verified against terms and live endpoint metadata.'
    },
    capabilities: ['basemap', 'terrain_context']
  },
  {
    id: 'ibb-open-data',
    name: 'İBB Açık Veri Portalı',
    jurisdiction: 'municipal',
    category: 'open_data',
    municipalityName: 'İstanbul Büyükşehir Belediyesi',
    homepageUrl: 'https://data.ibb.gov.tr/',
    connectorKinds: [ConnectorKind.OpenData],
    access: {
      status: AccessStatus.Public,
      notes: 'Public open data portal; individual datasets still need license and schema verification.'
    },
    capabilities: ['open_data_catalog', 'municipal_dataset_discovery']
  },
  {
    id: 'pendik-keos-imar',
    name: 'Pendik Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Pendik',
    homepageUrl: 'https://keos.pendik.bel.tr/imardurumu/',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'esenler-keos-imar',
    name: 'Esenler Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Esenler',
    homepageUrl: 'https://keos.esenler.bel.tr/imardurumu/index.aspx',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'canakkale-webgis-imar',
    name: 'Çanakkale Belediyesi WebGIS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Çanakkale',
    homepageUrl: 'https://webgis.canakkale.bel.tr/imardurumu/index.aspx',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal WebGIS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'alanya-keos-imar',
    name: 'Alanya Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Alanya',
    homepageUrl: 'https://keos.alanya.bel.tr/imardurumu/index.aspx',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'konak-keos-imar',
    name: 'Konak Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Konak',
    homepageUrl: 'https://keos.konak.bel.tr/imardurumu/',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'cankaya-imar-durumu',
    name: 'Çankaya Belediyesi İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Çankaya',
    homepageUrl: 'https://imardurumu.cankaya.bel.tr/',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal zoning portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'sultangazi-webgis-imar',
    name: 'Sultangazi Belediyesi WebGIS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Sultangazi',
    homepageUrl: 'https://webgis.sultangazi.bel.tr/imardurumu/',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal WebGIS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'basaksehir-webgis-imar',
    name: 'Başakşehir Belediyesi WebGIS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Başakşehir',
    homepageUrl: 'https://webgis.basaksehir.bel.tr/imardurumu/',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal WebGIS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'ibb-sehir-haritasi',
    name: 'İBB Şehir Haritası',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'İstanbul Büyükşehir Belediyesi',
    homepageUrl: 'https://sehirharitasi.ibb.gov.tr',
    connectorKinds: [ConnectorKind.MunicipalPortal, ConnectorKind.ArcGisRest],
    access: { status: AccessStatus.Unknown, notes: 'Seed metropolitan GIS portal; service endpoints must be discovered from live network metadata.' },
    capabilities: ['municipal_gis', 'basemap_context']
  },
  {
    id: 'ankara-imar',
    name: 'Ankara Büyükşehir Belediyesi İmar',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Ankara Büyükşehir Belediyesi',
    homepageUrl: 'https://imar.ankara.bel.tr',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed metropolitan zoning portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'izmir-cbs',
    name: 'İzmir Büyükşehir Belediyesi CBS',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'İzmir Büyükşehir Belediyesi',
    homepageUrl: 'https://cbs.izmir.bel.tr',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed metropolitan CBS portal; live probing determines endpoint health.' },
    capabilities: ['municipal_gis']
  },
  {
    id: 'openstreetmap-api',
    name: 'OpenStreetMap API',
    jurisdiction: 'global',
    category: 'basemap',
    homepageUrl: 'https://wiki.openstreetmap.org/wiki/API',
    connectorKinds: [ConnectorKind.Basemap, ConnectorKind.OpenData],
    access: {
      status: AccessStatus.Public,
      notes: 'Public OSM documentation. Production use must respect OSM tile/API usage policies.'
    },
    capabilities: ['basemap', 'open_geodata']
  }
];

export const MUNICIPAL_DOMAIN_PATTERNS = [
  'https://keos.{municipality}.bel.tr/',
  'https://webgis.{municipality}.bel.tr/',
  'https://cbs.{municipality}.bel.tr/',
  'https://eimar.{municipality}.bel.tr/',
  'https://imar.{municipality}.bel.tr/',
  'https://kentrehberi.{municipality}.bel.tr/'
] as const;
