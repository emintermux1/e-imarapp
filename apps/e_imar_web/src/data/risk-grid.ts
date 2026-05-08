/**
 * AFAD bazlı yaklaşık deprem risk gradient'i — gerçek bir API yerine,
 * Türkiye genelinde hücreli (grid) bir mock veri üretiyoruz. Yeni Marmara
 * fayı, Doğu Anadolu, Ege bölgeleri gibi yüksek riskli bölgelerin yakınında
 * yüksek değer üreten basit bir Gaussian kompozisyon kullanıyoruz.
 *
 * Bu, "Risk Haritası" katmanı kapatılana kadar haritada gradient bir
 * görünüm sağlar.
 */

interface RiskCenter {
  lng: number;
  lat: number;
  severity: 1 | 2 | 3 | 4 | 5;
  /** Etki yarıçapı (derece) */
  radiusDeg: number;
  /** İsim (tooltip için) */
  name: string;
}

const HIGH_RISK_CENTERS: RiskCenter[] = [
  { lng: 28.9, lat: 40.95, severity: 5, radiusDeg: 0.8, name: "Marmara Hattı" },
  { lng: 27.13, lat: 38.4, severity: 5, radiusDeg: 0.55, name: "İzmir Körfezi" },
  { lng: 30.7, lat: 36.86, severity: 4, radiusDeg: 0.45, name: "Antalya Kıyıları" },
  { lng: 36.16, lat: 36.2, severity: 5, radiusDeg: 0.6, name: "Doğu Anadolu Fayı" },
  { lng: 41.27, lat: 39.9, severity: 4, radiusDeg: 0.55, name: "Erzurum Hattı" },
  { lng: 32.85, lat: 39.93, severity: 2, radiusDeg: 0.6, name: "Ankara" },
  { lng: 29, lat: 40.2, severity: 4, radiusDeg: 0.4, name: "Bursa Hattı" },
  { lng: 35.32, lat: 38.74, severity: 2, radiusDeg: 0.55, name: "Kayseri" },
  { lng: 32.5, lat: 37.87, severity: 1, radiusDeg: 0.6, name: "Konya Ovası" },
  { lng: 35.55, lat: 41.28, severity: 2, radiusDeg: 0.55, name: "Samsun" },
  { lng: 39.72, lat: 41, severity: 3, radiusDeg: 0.45, name: "Trabzon" },
  { lng: 35.32, lat: 37, severity: 4, radiusDeg: 0.55, name: "Adana" },
  { lng: 34.6, lat: 36.81, severity: 3, radiusDeg: 0.45, name: "Mersin" }
];

interface RiskFeatureProps {
  severity: number;
  ada: string;
  parsel: string;
  /** "neighborhood" of the closest high-risk center */
  near: string;
}

/**
 * Generate a sparse grid (~14×8) over Türkiye. Each cell receives the
 * maximum of all `HIGH_RISK_CENTERS` Gaussian responses; cells with
 * effectively zero response are dropped.
 */
function generateRiskGrid(): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  RiskFeatureProps
> {
  const features: GeoJSON.Feature<GeoJSON.Point, RiskFeatureProps>[] = [];
  const lngStart = 26;
  const lngEnd = 45;
  const latStart = 36;
  const latEnd = 42;
  const stepLng = 0.45;
  const stepLat = 0.4;

  for (let lat = latStart; lat <= latEnd; lat += stepLat) {
    for (let lng = lngStart; lng <= lngEnd; lng += stepLng) {
      let bestSeverity = 0;
      let nearest = "—";
      for (const c of HIGH_RISK_CENTERS) {
        const dx = lng - c.lng;
        const dy = lat - c.lat;
        const d2 = dx * dx + dy * dy;
        const r2 = c.radiusDeg * c.radiusDeg;
        const response =
          c.severity * Math.exp(-(d2 / Math.max(r2, 1e-3)) * 1.4);
        if (response > bestSeverity) {
          bestSeverity = response;
          nearest = c.name;
        }
      }
      const severity = Math.round(Math.min(5, Math.max(0, bestSeverity)));
      if (severity < 1) continue;
      features.push({
        type: "Feature",
        properties: {
          severity,
          ada: "—",
          parsel: "—",
          near: nearest
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat]
        }
      });
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
}

let cached: GeoJSON.FeatureCollection<GeoJSON.Point, RiskFeatureProps> | null =
  null;

export function getRiskGridCollection() {
  if (!cached) cached = generateRiskGrid();
  return cached;
}

export const RISK_GRID_SOURCE_ID = "risk-grid";
