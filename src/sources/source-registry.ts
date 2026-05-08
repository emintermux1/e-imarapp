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
    id: 'edevlet-csb-tucbs',
    name: 'e-Devlet ÇŞİDB TUCBS Hizmeti',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://www.turkiye.gov.tr/csb-tucbs-8514',
    connectorKinds: [ConnectorKind.NationalPortal],
    access: {
      status: AccessStatus.RequiresCredentials,
      notes: 'e-Devlet flow requires citizen or institutional authentication; connector must implement a legal credential workflow before access.'
    },
    capabilities: ['authenticated_service_catalog', 'tucbs_access']
  },
  {
    id: 'csb-cbs',
    name: 'ÇŞİDB Coğrafi Bilgi Sistemleri',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://cbs.csb.gov.tr/',
    connectorKinds: [ConnectorKind.NationalPortal, ConnectorKind.OpenData],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Official CBS portal; discovery must identify public catalogs and protected service boundaries separately.'
    },
    capabilities: ['national_cbs_catalog', 'geospatial_services']
  },
  {
    id: 'icisleri-e-belediye',
    name: 'İçişleri Bakanlığı e-Belediye',
    jurisdiction: 'national',
    category: 'municipal_gis',
    homepageUrl: 'https://www.belediye.gov.tr/',
    connectorKinds: [ConnectorKind.NationalPortal],
    access: {
      status: AccessStatus.RequiresCredentials,
      notes: 'Central e-Belediye system is expected to require institutional access for operational data.'
    },
    capabilities: ['municipality_registry', 'institutional_services']
  },
  {
    id: 'akilli-sehirler-yerel-veri',
    name: 'Akıllı Şehirler Yerel Veri Platformları',
    jurisdiction: 'national',
    category: 'open_data',
    homepageUrl: 'https://akillisehirler.csb.gov.tr/yerel-veri-platformlari/',
    connectorKinds: [ConnectorKind.OpenData],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Official local data platforms page; discovery should harvest only public catalog metadata.'
    },
    capabilities: ['local_data_platform_discovery']
  },
  {
    id: 'netcad-netgis-server',
    name: 'Netcad NetGIS Server',
    jurisdiction: 'national',
    category: 'municipal_gis',
    homepageUrl: 'https://www.netcad.com/netgis-server',
    connectorKinds: [ConnectorKind.NetcadKeos],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Vendor product documentation and portal entry for NetGIS/KEOS patterns; not itself a parcel data source.'
    },
    capabilities: ['netcad_fingerprint_reference', 'keos_connector_reference']
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
    id: 'esri-world-imagery',
    name: 'Esri World Imagery MapServer',
    jurisdiction: 'global',
    category: 'basemap',
    homepageUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    connectorKinds: [ConnectorKind.ArcGisRest, ConnectorKind.RasterTile, ConnectorKind.Satellite],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Public ArcGIS REST imagery service endpoint; production usage must follow Esri terms.'
    },
    capabilities: ['satellite_imagery', 'arcgis_rest', 'raster_tiles']
  },
  {
    id: 'copernicus-data-space',
    name: 'Copernicus Data Space Ecosystem',
    jurisdiction: 'global',
    category: 'satellite',
    homepageUrl: 'https://dataspace.copernicus.eu/',
    connectorKinds: [ConnectorKind.OpenData, ConnectorKind.Satellite],
    access: {
      status: AccessStatus.RequiresCredentials,
      notes: 'Sentinel data access can require account/API credentials; connector must use official auth flows.'
    },
    capabilities: ['sentinel_imagery', 'satellite_archive']
  },
  {
    id: 'usgs-landsat',
    name: 'USGS Landsat Data',
    jurisdiction: 'global',
    category: 'satellite',
    homepageUrl: 'https://landsat.gsfc.nasa.gov/data/',
    connectorKinds: [ConnectorKind.OpenData, ConnectorKind.Satellite],
    access: {
      status: AccessStatus.Unknown,
      notes: 'Landsat data portal documentation; connector must verify exact API account requirements per product.'
    },
    capabilities: ['landsat_imagery', 'satellite_archive']
  },
  {
    id: 'mapbox-maps-api',
    name: 'Mapbox Maps API',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://docs.mapbox.com/api/maps/',
    connectorKinds: [ConnectorKind.VectorTile, ConnectorKind.RasterTile, ConnectorKind.Basemap],
    access: {
      status: AccessStatus.RequiresCredentials,
      notes: 'Commercial map API requires access token and terms-compliant use.'
    },
    capabilities: ['vector_tiles', 'raster_tiles', 'basemap']
  },
  {
    id: 'maptiler-cloud-api',
    name: 'MapTiler Cloud API',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://docs.maptiler.com/cloud/api/',
    connectorKinds: [ConnectorKind.VectorTile, ConnectorKind.RasterTile, ConnectorKind.Basemap],
    access: {
      status: AccessStatus.RequiresCredentials,
      notes: 'Commercial map API requires API key and terms-compliant use.'
    },
    capabilities: ['vector_tiles', 'raster_tiles', 'basemap']
  },
  {
    id: 'here-map-tile-api',
    name: 'HERE Map Tile API',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://developer.here.com/documentation',
    connectorKinds: [ConnectorKind.RasterTile, ConnectorKind.VectorTile, ConnectorKind.Basemap],
    access: {
      status: AccessStatus.RequiresCredentials,
      notes: 'Commercial HERE APIs require credentials and product-specific license review.'
    },
    capabilities: ['basemap', 'routing_context', 'tiles']
  },
  {
    id: 'cesium-ion',
    name: 'Cesium ion',
    jurisdiction: 'global',
    category: 'tile_service',
    homepageUrl: 'https://cesium.com/platform/cesium-ion/',
    connectorKinds: [ConnectorKind.VectorTile, ConnectorKind.Basemap],
    access: {
      status: AccessStatus.RequiresCredentials,
      notes: 'Cesium ion requires account/token for hosted assets and 3D Tiles workflows.'
    },
    capabilities: ['3d_tiles', 'terrain_tiles', 'citygml_pipeline']
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
    id: 'pamukkale-keos-imar',
    name: 'Pamukkale Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Pamukkale',
    homepageUrl: 'http://keos.pamukkale.bel.tr/imardurumu/index.aspx',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'cerkezkoy-webgis-imar',
    name: 'Çerkezköy Belediyesi WebGIS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Çerkezköy',
    homepageUrl: 'https://webgis.cerkezkoy.bel.tr:444/imardurumu/',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal WebGIS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'kahramankazan-keos-imar',
    name: 'Kahramankazan Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Kahramankazan',
    homepageUrl: 'https://keos.kahramankazan.bel.tr:8880/imardurumu/',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
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
    id: 'merkezefendi-keos-imar',
    name: 'Merkezefendi Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Merkezefendi',
    homepageUrl: 'https://keos.merkezefendi.bel.tr/imardurumu/index.aspx',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'altinordu-ekent-imar',
    name: 'Altınordu Belediyesi eKent İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Altınordu',
    homepageUrl: 'https://ekent.altinordu.bel.tr/imardurumu/',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal eKent portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'aksaray-ebelediye-imar',
    name: 'Aksaray Belediyesi e-Belediye İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Aksaray',
    homepageUrl: 'https://ebelediye.aksaray.bel.tr:444/imardurumu/',
    connectorKinds: [ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal e-Belediye portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
  },
  {
    id: 'sehitkamil-keos-imar',
    name: 'Şehitkamil Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Şehitkamil',
    homepageUrl: 'https://keos.sehitkamil.bel.tr/imardurumu/',
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
    id: 'tusba-keos-imar',
    name: 'Tuşba Belediyesi KEOS İmar Durumu',
    jurisdiction: 'municipal',
    category: 'municipal_gis',
    municipalityName: 'Tuşba',
    homepageUrl: 'https://keos.tusba.bel.tr:8282/imardurumu/index.aspx',
    connectorKinds: [ConnectorKind.NetcadKeos, ConnectorKind.MunicipalPortal],
    access: { status: AccessStatus.Unknown, notes: 'Seed municipal KEOS portal; live probing determines endpoint health.' },
    capabilities: ['zoning_status', 'municipal_gis']
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
