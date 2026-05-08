export type ZoningType =
  | "Konut"
  | "Ticaret"
  | "Karma"
  | "Sanayi"
  | "Yesil"
  | "Tarim"
  | "Kamu"
  | "Turizm";

export type YapilasmaSekli = "Ayrik" | "Bitisik" | "Blok";

export type TapuTipi = "Arsa" | "Tarla" | "Bag" | "Bahce" | "Bina";

export type AskiDurum = "askida" | "onaylandi" | "reddedildi" | "yok";

export interface Riskler {
  /** AFAD seviyeleri 1-5 */
  deprem: 1 | 2 | 3 | 4 | 5;
  heyelan: 0 | 1 | 2 | 3;
  sel: 0 | 1 | 2 | 3;
  yangin: 0 | 1 | 2 | 3;
}

export interface Aski {
  durum: "askida" | "onaylandi" | "reddedildi";
  baslangic: string; // ISO
  bitis: string; // ISO
  askiNo: string;
}

export interface Cevre {
  metroM: number;
  hastaneKm: number;
  okulKm: number;
  parkM: number;
  ulasimSkoru: number;
  gurultuSkoru: number;
}

export interface ParcelProps {
  /** Original string identifier (TR-{plaka}-{ilce}-{ada}-{parsel}) */
  id: string;
  /** Numeric MapLibre feature id for feature-state lookups */
  mapId: number;
  ada: string;
  parsel: string;
  il: string;
  ilce: string;
  mahalle: string;
  pafta?: string;
  yuzolcumuM2: number;
  tapuTipi: TapuTipi;
  zoningType: ZoningType;
  yapilasmaSekli: YapilasmaSekli;
  taks: number;
  kaks: number;
  gabariM: number;
  katSiniri: number;
  yolCephesiM: number;
  planAdi: string;
  planOnayTarihi: string; // ISO
  yatirimSkoru: number;
  riskler: Riskler;
  aski?: Aski;
  cevre: Cevre;
  planNotlari: string[];
  /** [lng, lat] convenience centroid */
  centroid?: [number, number];
  sourceStatus?: import("./api").DataSourceStatus;
  backendId?: number;
  sourceNote?: string;
}

export interface ParcelFeature {
  type: "Feature";
  id: number;
  properties: ParcelProps;
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // [ring][[lng,lat]]
  };
}

export interface ParcelFeatureCollection {
  type: "FeatureCollection";
  features: ParcelFeature[];
}
