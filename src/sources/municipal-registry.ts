export type MunicipalSourceType = 'keos' | 'webgis' | 'ekent' | 'custom';
export type MunicipalVendor = 'netcad' | 'custom' | 'tkgm' | 'csb';
export type MunicipalStatus = 'unknown' | 'available' | 'captcha_required' | 'unavailable';
export type MunicipalRegion = 'istanbul' | 'ankara' | 'izmir' | 'diger';
export type MunicipalBBox = [number, number, number, number];

export interface MunicipalRegistryEntry {
  id: string;
  name: string;
  baseUrl: string;
  type: MunicipalSourceType;
  vendor: MunicipalVendor;
  queryPath: string;
  status: MunicipalStatus;
  region: MunicipalRegion;
  province: string;
  district?: string;
  bbox: MunicipalBBox;
}

export const MUNICIPAL_REGISTRY: MunicipalRegistryEntry[] = [
  municipality('pendik', 'Pendik Belediyesi', 'https://keos.pendik.bel.tr/', 'keos', 'netcad', 'istanbul', 'İstanbul', 'Pendik', [29.18, 40.82, 29.39, 41.03]),
  municipality('esenler', 'Esenler Belediyesi', 'https://keos.esenler.bel.tr/', 'keos', 'netcad', 'istanbul', 'İstanbul', 'Esenler', [28.84, 41.02, 28.91, 41.08]),
  municipality('alanya', 'Alanya Belediyesi', 'https://keos.alanya.bel.tr/', 'keos', 'netcad', 'diger', 'Antalya', 'Alanya', [31.86, 36.42, 32.55, 36.75]),
  municipality('konak', 'Konak Belediyesi', 'https://keos.konak.bel.tr/', 'keos', 'netcad', 'izmir', 'İzmir', 'Konak', [27.06, 38.37, 27.18, 38.47]),
  municipality('merkezefendi', 'Merkezefendi Belediyesi', 'https://keos.merkezefendi.bel.tr/', 'keos', 'netcad', 'diger', 'Denizli', 'Merkezefendi', [29.00, 37.70, 29.18, 37.86]),
  municipality('pamukkale', 'Pamukkale Belediyesi', 'http://keos.pamukkale.bel.tr/', 'keos', 'netcad', 'diger', 'Denizli', 'Pamukkale', [29.04, 37.73, 29.35, 37.98]),
  municipality('kahramankazan', 'Kahramankazan Belediyesi', 'https://keos.kahramankazan.bel.tr:8880/', 'keos', 'netcad', 'ankara', 'Ankara', 'Kahramankazan', [32.44, 40.02, 32.83, 40.34]),
  municipality('tusba', 'Tuşba Belediyesi', 'https://keos.tusba.bel.tr:8282/', 'keos', 'netcad', 'diger', 'Van', 'Tuşba', [43.23, 38.45, 43.57, 38.68]),
  municipality('aksaray', 'Aksaray Belediyesi', 'https://ebelediye.aksaray.bel.tr:444/', 'keos', 'netcad', 'diger', 'Aksaray', 'Merkez', [33.90, 38.28, 34.14, 38.48]),
  municipality('sehitkamil', 'Şehitkamil Belediyesi', 'https://keos.sehitkamil.bel.tr/', 'keos', 'netcad', 'diger', 'Gaziantep', 'Şehitkamil', [37.23, 37.01, 37.55, 37.25]),
  municipality('suleymanpasa', 'Süleymanpaşa Belediyesi', 'https://keos.suleymanpasa.bel.tr:8080/', 'keos', 'netcad', 'diger', 'Tekirdağ', 'Süleymanpaşa', [27.38, 40.88, 27.65, 41.10]),
  municipality('mustafakemalpasa', 'Mustafakemalpaşa Belediyesi', 'http://keos.mustafakemalpasa.bel.tr/', 'keos', 'netcad', 'diger', 'Bursa', 'Mustafakemalpaşa', [28.20, 39.90, 28.70, 40.25]),
  municipality('gelibolu', 'Gelibolu Belediyesi', 'https://keos.gelibolu.bel.tr/', 'keos', 'netcad', 'diger', 'Çanakkale', 'Gelibolu', [26.45, 40.33, 26.78, 40.52]),
  municipality('caycuma', 'Çaycuma Belediyesi', 'https://keos.caycuma.bel.tr/', 'keos', 'netcad', 'diger', 'Zonguldak', 'Çaycuma', [32.02, 41.33, 32.25, 41.52]),
  municipality('canakkale', 'Çanakkale Belediyesi', 'https://webgis.canakkale.bel.tr/', 'webgis', 'netcad', 'diger', 'Çanakkale', 'Merkez', [26.35, 40.08, 26.48, 40.20]),
  municipality('cerkezkoy', 'Çerkezköy Belediyesi', 'https://webgis.cerkezkoy.bel.tr:444/', 'webgis', 'netcad', 'diger', 'Tekirdağ', 'Çerkezköy', [27.95, 41.22, 28.12, 41.35]),
  municipality('sultangazi', 'Sultangazi Belediyesi', 'https://webgis.sultangazi.bel.tr/', 'webgis', 'netcad', 'istanbul', 'İstanbul', 'Sultangazi', [28.83, 41.08, 28.94, 41.15]),
  municipality('basaksehir', 'Başakşehir Belediyesi', 'https://webgis.basaksehir.bel.tr/', 'webgis', 'netcad', 'istanbul', 'İstanbul', 'Başakşehir', [28.64, 41.04, 28.85, 41.17]),
  municipality('altinordu', 'Altınordu Belediyesi', 'https://ekent.altinordu.bel.tr/', 'ekent', 'custom', 'diger', 'Ordu', 'Altınordu', [37.80, 40.88, 38.12, 41.05]),
  municipality('kecioren', 'Keçiören Belediyesi', 'https://kbs.kecioren.bel.tr/', 'ekent', 'custom', 'ankara', 'Ankara', 'Keçiören', [32.76, 39.94, 32.94, 40.08], '/'),
  municipality('ibb', 'İstanbul Büyükşehir Belediyesi', 'https://sehirharitasi.ibb.gov.tr/', 'custom', 'custom', 'istanbul', 'İstanbul', 'Büyükşehir', [28.00, 40.80, 29.95, 41.65], '/'),
  municipality('ankara', 'Ankara Büyükşehir Belediyesi', 'https://imar.ankara.bel.tr/', 'custom', 'custom', 'ankara', 'Ankara', 'Büyükşehir', [31.50, 39.20, 33.60, 40.50], '/'),
  municipality('izmir', 'İzmir Büyükşehir Belediyesi', 'https://cbs.izmir.bel.tr/', 'custom', 'custom', 'izmir', 'İzmir', 'Büyükşehir', [26.20, 37.85, 28.35, 39.35], '/'),
  municipality('cankaya', 'Çankaya Belediyesi', 'https://imardurumu.cankaya.bel.tr/', 'custom', 'custom', 'ankara', 'Ankara', 'Çankaya', [32.72, 39.84, 32.94, 40.00], '/'),
  municipality('tkgm', 'TKGM Parsel Sorgu', 'https://parselsorgu.tkgm.gov.tr/', 'custom', 'tkgm', 'diger', 'Türkiye', 'Merkezi Devlet', [25.67, 35.80, 44.82, 42.11], '/'),
  municipality('eplan', 'ÇŞİDB E-Plan', 'https://eplan.csb.gov.tr/', 'custom', 'csb', 'diger', 'Türkiye', 'Merkezi Devlet', [25.67, 35.80, 44.82, 42.11], '/'),
  municipality('tucbs', 'TUCBS Public API', 'https://tucbs-public-api.csb.gov.tr/', 'custom', 'csb', 'diger', 'Türkiye', 'Merkezi Devlet', [25.67, 35.80, 44.82, 42.11], '/'),
  municipality('atlas', 'Atlas Ulusal CBS', 'https://www.atlas.gov.tr/', 'custom', 'csb', 'diger', 'Türkiye', 'Merkezi Devlet', [25.67, 35.80, 44.82, 42.11], '/')
];

export function findMunicipalRegistryEntry(id: string | undefined): MunicipalRegistryEntry | undefined {
  const normalized = normalizeMunicipalText(id);
  if (!normalized) return undefined;
  return MUNICIPAL_REGISTRY.find((entry) => normalizeMunicipalText(entry.id) === normalized || normalizeMunicipalText(entry.name).includes(normalized));
}

export function municipalitiesContainingCoordinate(lng: number, lat: number): MunicipalRegistryEntry[] {
  return MUNICIPAL_REGISTRY.filter((entry) => {
    const [minLng, minLat, maxLng, maxLat] = entry.bbox;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  });
}

export function normalizeMunicipalText(value: string | undefined): string {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function municipality(
  id: string,
  name: string,
  baseUrl: string,
  type: MunicipalSourceType,
  vendor: MunicipalVendor,
  region: MunicipalRegion,
  province: string,
  district: string,
  bbox: MunicipalBBox,
  queryPath = '/imardurumu/'
): MunicipalRegistryEntry {
  return {
    id,
    name,
    baseUrl,
    type,
    vendor,
    queryPath,
    status: 'unknown',
    region,
    province,
    district,
    bbox
  };
}
