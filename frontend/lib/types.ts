export interface Parcel {
  id: string
  ada: string
  parsel: string
  il: string
  ilce: string
  mahalle: string
  geometri: GeoJSON.Feature
  imarDurumu: string
  planlar: Plan[]
}

export interface Plan {
  id: string
  adi: string
  tipi: string
  durum: string
  tarih: string
  belediye: Municipality
}

export interface Municipality {
  id: string
  adi: string
  slug: string
  il: string
  ilce: string
}

export interface SimulationParams {
  buildingHeight: number
  floorCount: number
  buildingType: string
}

export interface SatelliteAnalysis {
  changes: GeoJSON.Feature[]
  illegalConstructions: GeoJSON.Feature[]
}

export interface Report {
  id: string
  baslik: string
  tarih: string
  tur: string
  url: string
}

export interface WatchlistItem {
  id: string
  parselId: string
  adi: string
  tarih: string
}