export interface LngLat {
  lng: number;
  lat: number;
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface SearchResultBase {
  id: string;
  type: "parcel" | "address" | "coordinate" | "belediye" | "location";
  primary: string;
  secondary?: string;
  meta?: string;
  centroid?: [number, number];
  bbox?: BBox;
}

export interface ParcelSearchResult extends SearchResultBase {
  type: "parcel";
  parcelId: string;
  zoningType: import("./parcel").ZoningType;
  municipalityId?: string;
  sourceUrl?: string;
  sourceStatus?: import("./api").DataSourceStatus;
  sourceName?: string;
  sourceProvider?: string;
  geometryAvailable?: boolean;
  qualityHints?: string[];
  planMatchStatus?: string;
  askiMatchStatus?: string;
  imarParamsStatus?: string;
  ambiguityKey?: string;
  ambiguityCount?: number;
  confidenceLabel?: string;
}

export interface AddressSearchResult extends SearchResultBase {
  type: "address";
  il: string;
  ilce: string;
  mahalle?: string;
}

export interface BelediyeSearchResult extends SearchResultBase {
  type: "belediye";
  il: string;
  municipalityId?: string;
}

export interface CoordinateSearchResult extends SearchResultBase {
  type: "coordinate";
  lng: number;
  lat: number;
}

export interface LocationSearchResult extends SearchResultBase {
  type: "location";
  kind: "il" | "ilce" | "mahalle";
  zoom: number;
  il?: string;
  ilce?: string;
  mahalle?: string;
}

export type SearchResult =
  | ParcelSearchResult
  | AddressSearchResult
  | BelediyeSearchResult
  | CoordinateSearchResult
  | LocationSearchResult;
