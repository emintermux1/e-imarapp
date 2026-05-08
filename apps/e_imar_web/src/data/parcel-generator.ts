import parcelsRaw from "./parcels.geo.json";
import { DEMO_PARCEL_CLUSTERS, type ParcelClusterSeed } from "./parcel-seeds";
import type {
  Aski,
  ParcelFeature,
  ParcelFeatureCollection,
  ParcelProps,
  Riskler,
  TapuTipi,
  YapilasmaSekli,
  ZoningType
} from "@/types/parcel";

const FEATURED = parcelsRaw as unknown as ParcelFeatureCollection;

let cachedCollection: ParcelFeatureCollection | null = null;
let cachedAskida = 0;

interface Rng {
  next: () => number;
}

function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: string): Rng {
  let state = hashSeed(seed) || 1;
  return {
    next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };
}

function rand(rng: Rng, min: number, max: number) {
  return min + (max - min) * rng.next();
}

function int(rng: Rng, min: number, max: number) {
  return Math.floor(rand(rng, min, max + 1));
}

function pick<T>(rng: Rng, values: readonly T[]): T {
  return values[Math.min(values.length - 1, Math.floor(rng.next() * values.length))];
}

function pickWeighted<T extends string>(rng: Rng, weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let threshold = rng.next() * total;
  for (const [key, weight] of entries) {
    threshold -= weight;
    if (threshold <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function round(value: number, decimals = 2) {
  const m = 10 ** decimals;
  return Math.round(value * m) / m;
}

function slugPart(value: string) {
  return value
    .toLocaleUpperCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ş/g, "S")
    .replace(/Ç/g, "C")
    .replace(/Ö/g, "O")
    .replace(/Ü/g, "U")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
}

function zoningMetrics(zoning: ZoningType, rng: Rng) {
  switch (zoning) {
    case "Ticaret":
      return { taks: round(rand(rng, 0.35, 0.6)), kaks: round(rand(rng, 1.8, 4.2)), kat: int(rng, 5, 14), gabari: round(rand(rng, 18, 48), 1), yapilasma: pick(rng, ["Bitisik", "Blok"] as YapilasmaSekli[]) };
    case "Karma":
      return { taks: round(rand(rng, 0.3, 0.55)), kaks: round(rand(rng, 1.6, 3.8)), kat: int(rng, 5, 12), gabari: round(rand(rng, 16, 42), 1), yapilasma: pick(rng, ["Ayrik", "Blok", "Bitisik"] as YapilasmaSekli[]) };
    case "Sanayi":
      return { taks: round(rand(rng, 0.35, 0.65)), kaks: round(rand(rng, 0.7, 1.8)), kat: int(rng, 1, 4), gabari: round(rand(rng, 8, 18), 1), yapilasma: pick(rng, ["Blok", "Ayrik"] as YapilasmaSekli[]) };
    case "Yesil":
      return { taks: round(rand(rng, 0.02, 0.08)), kaks: round(rand(rng, 0.03, 0.15)), kat: 1, gabari: round(rand(rng, 3.5, 6), 1), yapilasma: "Ayrik" as YapilasmaSekli };
    case "Tarim":
      return { taks: round(rand(rng, 0.04, 0.12)), kaks: round(rand(rng, 0.05, 0.2)), kat: int(rng, 1, 2), gabari: round(rand(rng, 4.5, 7.5), 1), yapilasma: "Ayrik" as YapilasmaSekli };
    case "Kamu":
      return { taks: round(rand(rng, 0.2, 0.45)), kaks: round(rand(rng, 0.6, 1.8)), kat: int(rng, 2, 6), gabari: round(rand(rng, 8, 22), 1), yapilasma: pick(rng, ["Ayrik", "Blok"] as YapilasmaSekli[]) };
    case "Turizm":
      return { taks: round(rand(rng, 0.25, 0.5)), kaks: round(rand(rng, 1, 2.8)), kat: int(rng, 3, 9), gabari: round(rand(rng, 12, 30), 1), yapilasma: pick(rng, ["Ayrik", "Blok"] as YapilasmaSekli[]) };
    case "Konut":
    default:
      return { taks: round(rand(rng, 0.22, 0.42)), kaks: round(rand(rng, 0.9, 2.4)), kat: int(rng, 3, 8), gabari: round(rand(rng, 9.5, 27.5), 1), yapilasma: pick(rng, ["Ayrik", "Blok", "Bitisik"] as YapilasmaSekli[]) };
  }
}

function planAdi(zoning: ZoningType, rng: Rng) {
  const base = pick(rng, ["1/1000 Ölçekli Uygulama İmar Planı", "Revizyon Uygulama İmar Planı", "Koruma Amaçlı UİP", "Mevzii İmar Planı", "1/5000 Nazım Plan Uyumlu UİP"]);
  if (zoning === "Turizm") return "Turizm Alanı Uygulama İmar Planı";
  if (zoning === "Sanayi") return "Sanayi Alanı Revizyon İmar Planı";
  return base;
}

function planNotlari(zoning: ZoningType, cluster: ParcelClusterSeed, rng: Rng): string[] {
  const notes = [
    "3194 sayılı İmar Kanunu uyarınca uygulanır.",
    "Çekme mesafesi: ön bahçe 5 m, yan bahçe 3 m.",
    "Otopark Yönetmeliği gereği parsel içinde otopark zorunludur.",
    "Yol kotu üzerinden gabari hesaplanır.",
    "Jeolojik-jeoteknik etüt raporu dikkate alınacaktır.",
    "Toplanma alanı mesafesi 500 m içinde değerlendirilecektir.",
    "Bu kayıt sentetik demo veridir; resmi kadastro kaydı değildir."
  ];
  if (zoning === "Ticaret" || zoning === "Karma") notes.push("Zemin katlarda ticari kullanım sürekliliği aranır.");
  if (zoning === "Yesil") notes.push("Açık ve yeşil alan niteliği korunacaktır.");
  if (zoning === "Sanayi") notes.push("Çevresel etki ve servis yolu koşulları sağlanmadan ruhsatlandırılamaz.");
  if (cluster.kind === "coastal") notes.push("Kıyı yaklaşma ve siluet kararları saklıdır.");
  const count = int(rng, 3, 5);
  return [...notes].sort(() => rng.next() - 0.5).slice(0, count);
}

function buildAski(cluster: ParcelClusterSeed, index: number, rng: Rng): Aski | undefined {
  const activeDistricts = ["istanbul", "ankara", "izmir", "bursa", "antalya"];
  const cityKey = cluster.il.toLocaleLowerCase("tr-TR");
  const probability = activeDistricts.some((c) => cityKey.includes(c)) ? 0.09 : 0.045;
  if (rng.next() > probability) return undefined;
  const durum = pick(rng, ["askida", "askida", "onaylandi", "reddedildi"] as const);
  const month = durum === "askida" ? int(rng, 4, 6) : int(rng, 1, 12);
  const startDay = int(rng, 1, 20);
  const year = durum === "askida" ? 2026 : pick(rng, [2024, 2025, 2026]);
  const start = new Date(Date.UTC(year, month - 1, startDay));
  const end = new Date(start.getTime() + int(rng, 30, 75) * 86400000);
  return {
    durum,
    baslangic: start.toISOString().slice(0, 10),
    bitis: end.toISOString().slice(0, 10),
    askiNo: `AS-${year}/${String(index + int(rng, 40, 960)).padStart(4, "0")}`
  };
}

function riskler(cluster: ParcelClusterSeed, rng: Rng): Riskler {
  const deprem = Math.max(1, Math.min(5, cluster.riskBase + int(rng, -1, 1))) as Riskler["deprem"];
  const coastal = cluster.kind === "coastal";
  return {
    deprem,
    heyelan: Math.max(0, Math.min(3, coastal ? int(rng, 0, 2) : int(rng, 0, 1))) as Riskler["heyelan"],
    sel: Math.max(0, Math.min(3, coastal ? int(rng, 1, 3) : int(rng, 0, 2))) as Riskler["sel"],
    yangin: Math.max(0, Math.min(3, cluster.kind === "agricultural" ? int(rng, 1, 3) : int(rng, 0, 2))) as Riskler["yangin"]
  };
}

function parcelRect(center: [number, number], width: number, height: number, rot: number, rng: Rng): [number, number][] {
  const [lng, lat] = center;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const pts: [number, number][] = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2]
  ].map(([x, y]) => {
    const jx = x + rand(rng, -width * 0.05, width * 0.05);
    const jy = y + rand(rng, -height * 0.05, height * 0.05);
    return [round(lng + jx * c - jy * s, 7), round(lat + jx * s + jy * c, 7)] as [number, number];
  });
  pts.push(pts[0]);
  return pts;
}

function generateCluster(cluster: ParcelClusterSeed, startMapId: number): ParcelFeature[] {
  const rng = createRng(cluster.id);
  const features: ParcelFeature[] = [];
  const cols = Math.ceil(Math.sqrt(cluster.count * 1.35));
  const rows = Math.ceil(cluster.count / cols);
  const baseLngStep = cluster.kind === "central" ? 0.0005 : 0.00062;
  const baseLatStep = cluster.kind === "central" ? 0.00038 : 0.00048;
  const rot = rand(rng, -0.28, 0.28);
  let n = 0;

  for (let r = 0; r < rows && n < cluster.count; r += 1) {
    for (let c = 0; c < cols && n < cluster.count; c += 1) {
      if (rng.next() < 0.08 && n < cluster.count - 1) continue;
      const rowOffset = r % 2 === 0 ? 0 : baseLngStep * 0.35;
      const localX = (c - cols / 2) * baseLngStep + rowOffset + rand(rng, -0.00008, 0.00008);
      const localY = (r - rows / 2) * baseLatStep + rand(rng, -0.00006, 0.00006);
      const x = localX * Math.cos(rot) - localY * Math.sin(rot);
      const y = localX * Math.sin(rot) + localY * Math.cos(rot);
      const centroid: [number, number] = [round(cluster.center[0] + x, 7), round(cluster.center[1] + y, 7)];
      const zoningType = pickWeighted<ZoningType>(rng, cluster.zoningBias);
      const metrics = zoningMetrics(zoningType, rng);
      const width = rand(rng, baseLngStep * 0.52, baseLngStep * 0.86);
      const height = rand(rng, baseLatStep * 0.52, baseLatStep * 0.9);
      const ring = parcelRect(centroid, width, height, rot + rand(rng, -0.1, 0.1), rng);
      const mapId = startMapId + n;
      const ada = String(cluster.adaBase + Math.floor(n / 8));
      const parsel = String((n % 8) + 1 + int(rng, 0, 2));
      const stableId = `TR-${cluster.plaka}-${cluster.ilceCode}-${ada}-${parsel}-${String(n + 1).padStart(5, "0")}`;
      const area = Math.max(90, Math.round(width * height * 820000000 * rand(rng, 0.82, 1.18)));
      const aski = buildAski(cluster, n, rng);

      features.push({
        type: "Feature",
        id: mapId,
        properties: {
          id: stableId,
          mapId,
          ada,
          parsel,
          il: cluster.il,
          ilce: cluster.ilce,
          mahalle: cluster.mahalle,
          pafta: `${slugPart(cluster.ilce)}-${int(rng, 1, 9)}/${int(rng, 1, 4)}`,
          yuzolcumuM2: area,
          tapuTipi: zoningType === "Tarim" ? pick(rng, ["Tarla", "Bag", "Bahce"] as TapuTipi[]) : pick(rng, ["Arsa", "Arsa", "Bina", "Bahce"] as TapuTipi[]),
          zoningType,
          yapilasmaSekli: metrics.yapilasma,
          taks: metrics.taks,
          kaks: metrics.kaks,
          gabariM: metrics.gabari,
          katSiniri: metrics.kat,
          yolCephesiM: round(rand(rng, 6, 32), 1),
          planAdi: planAdi(zoningType, rng),
          planOnayTarihi: `${int(rng, 2016, 2025)}-${String(int(rng, 1, 12)).padStart(2, "0")}-${String(int(rng, 1, 28)).padStart(2, "0")}`,
          yatirimSkoru: Math.max(18, Math.min(96, Math.round(rand(rng, 38, 82) + (cluster.kind === "central" ? 10 : 0) + (zoningType === "Karma" || zoningType === "Ticaret" ? 5 : 0)))),
          riskler: riskler(cluster, rng),
          aski,
          cevre: {
            metroM: Math.round(cluster.kind === "central" ? rand(rng, 120, 950) : rand(rng, 500, 2800)),
            hastaneKm: round(rand(rng, 0.4, 4.8), 2),
            okulKm: round(rand(rng, 0.15, 2.9), 2),
            parkM: Math.round(rand(rng, 90, 900)),
            ulasimSkoru: Math.max(25, Math.min(99, Math.round(rand(rng, 45, 92) + (cluster.kind === "central" ? 7 : 0)))),
            gurultuSkoru: Math.max(15, Math.min(95, Math.round(rand(rng, 30, 82) + (zoningType === "Ticaret" ? 8 : 0))))
          },
          planNotlari: planNotlari(zoningType, cluster, rng),
          centroid
        },
        geometry: { type: "Polygon", coordinates: [ring] }
      });
      n += 1;
    }
  }
  return features;
}

function normalizeFeatured(): ParcelFeature[] {
  return FEATURED.features.map((feature, index) => {
    const mapId = index + 1;
    return {
      ...feature,
      id: mapId,
      properties: {
        ...feature.properties,
        mapId,
        planNotlari: feature.properties.planNotlari.includes("Bu kayıt sentetik demo veridir; resmi kadastro kaydı değildir.")
          ? feature.properties.planNotlari
          : [...feature.properties.planNotlari, "Bu kayıt sentetik demo veridir; resmi kadastro kaydı değildir."]
      }
    };
  });
}

export function generateDemoParcels(): ParcelFeatureCollection {
  if (cachedCollection) return cachedCollection;
  const featured = normalizeFeatured();
  const generated: ParcelFeature[] = [];
  let nextMapId = featured.length + 1;
  for (const cluster of DEMO_PARCEL_CLUSTERS) {
    const items = generateCluster(cluster, nextMapId);
    generated.push(...items);
    nextMapId += items.length;
  }
  const seen = new Set<string>();
  const features = [...featured, ...generated].filter((f) => {
    if (seen.has(f.properties.id)) return false;
    seen.add(f.properties.id);
    return true;
  });
  cachedAskida = features.filter((f) => f.properties.aski?.durum === "askida").length;
  cachedCollection = { type: "FeatureCollection", features };
  return cachedCollection;
}

export function getDemoParcelMetadata() {
  const collection = generateDemoParcels();
  return {
    featureCount: collection.features.length,
    askidaCount: cachedAskida
  };
}
