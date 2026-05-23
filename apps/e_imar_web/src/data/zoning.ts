import type { PlanLayer, PlanScale, PlanStatus } from "@/types/parcel";
import type { ZoningPreset } from "@/types/zoning";

export const PLAN_SCALE_LABELS: Record<PlanScale, string> = {
  "1/100000": "1/100.000 Çevre Düzeni",
  "1/25000": "1/25.000 Nazım",
  "1/5000": "1/5.000 Nazım",
  "1/1000": "1/1.000 Uygulama"
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  yururlukte: "Yürürlükte",
  askida: "Askıda",
  revizyon: "Revizyon",
  iptal: "İptal",
  taslak: "Taslak"
};

export const PLAN_LAYER_LABELS: Record<PlanLayer, string> = {
  nazim: "Nazım plan",
  uygulama: "Uygulama planı",
  aski: "Askı süreci",
  risk: "Risk / rezerv",
  koruma: "Koruma planı"
};

export const COMMON_PLAN_CONSTRAINTS = [
  "çekme mesafesi 5 m",
  "otopark yönetmeliği",
  "yükseklik mania kriteri",
  "dere mutlak koruma bandı",
  "sit etkileşim geçiş alanı",
  "jeolojik etüt gerekli",
  "kıyı kenar çizgisi kontrolü",
  "tevhid-ifraz şartı",
  "plan notu 12.4",
  "DSİ görüşü gerekli"
];

export const ZONING_PRESETS: Record<string, ZoningPreset> = {
  Konut: {
    type: "Konut",
    label: "Konut Alanı",
    shortLabel: "Konut",
    subcategories: ["Ayrık Nizam Konut Alanı", "Bitişik Nizam Konut Alanı", "Kentsel Dönüşüm / Rezerv Alan"],
    commonConstraints: ["çekme mesafesi 5 m", "otopark yönetmeliği", "jeolojik etüt gerekli"],
    fill: "#FFE9A8",
    stroke: "#C39A2B",
    fillVar: "var(--z-konut)",
    strokeVar: "var(--z-konut-stroke)",
    defaultKaks: [1.2, 2.4],
    defaultTaks: [0.25, 0.4]
  },
  Ticaret: {
    type: "Ticaret",
    label: "Ticaret / MİA",
    shortLabel: "MİA",
    subcategories: ["Merkezi İş Alanı (MİA)", "Ticaret-Konut Alanı (TİCK)", "Belediye Hizmet Alanı"],
    commonConstraints: ["otopark yönetmeliği", "yükseklik mania kriteri", "plan notu 12.4"],
    fill: "#FFCFC0",
    stroke: "#B14D2B",
    fillVar: "var(--z-ticaret)",
    strokeVar: "var(--z-ticaret-stroke)",
    defaultKaks: [2.0, 3.5],
    defaultTaks: [0.4, 0.6]
  },
  Karma: {
    type: "Karma",
    label: "TİCK / Karma Kullanım",
    shortLabel: "TİCK",
    subcategories: ["Ticaret-Konut Alanı (TİCK)", "Merkezi İş Alanı (MİA)", "Kentsel Dönüşüm / Rezerv Alan"],
    commonConstraints: ["otopark yönetmeliği", "tevhid-ifraz şartı", "plan notu 12.4"],
    fill: "#E2D2F2",
    stroke: "#6E48A8",
    fillVar: "var(--z-karma)",
    strokeVar: "var(--z-karma-stroke)",
    defaultKaks: [1.6, 3.0],
    defaultTaks: [0.3, 0.5]
  },
  Sanayi: {
    type: "Sanayi",
    label: "Sanayi / OSB",
    shortLabel: "OSB",
    subcategories: ["Küçük Sanayi Alanı", "Organize Sanayi Bölgesi"],
    commonConstraints: ["DSİ görüşü gerekli", "jeolojik etüt gerekli", "servis yolu şartı"],
    fill: "#C9D6E0",
    stroke: "#44607A",
    fillVar: "var(--z-sanayi)",
    strokeVar: "var(--z-sanayi-stroke)",
    defaultKaks: [0.8, 1.5],
    defaultTaks: [0.4, 0.55]
  },
  Yesil: {
    type: "Yesil",
    label: "Park / Yeşil Alan",
    shortLabel: "Yeşil",
    subcategories: ["Park ve Yeşil Alan", "Spor Alanı", "Koruma Alanı / Sit Etkileşim"],
    commonConstraints: ["sit etkileşim geçiş alanı", "dere mutlak koruma bandı", "kıyı kenar çizgisi kontrolü"],
    fill: "#C6E5C2",
    stroke: "#3D7A33",
    fillVar: "var(--z-yesil)",
    strokeVar: "var(--z-yesil-stroke)",
    defaultKaks: [0.05, 0.15],
    defaultTaks: [0.05, 0.1]
  },
  Tarim: {
    type: "Tarim",
    label: "Tarım Alanı",
    shortLabel: "Tarım",
    subcategories: ["Tarım Alanı", "Koruma Alanı / Sit Etkileşim"],
    commonConstraints: ["DSİ görüşü gerekli", "tevhid-ifraz şartı", "dere mutlak koruma bandı"],
    fill: "#E5DDB3",
    stroke: "#87772F",
    fillVar: "var(--z-tarim)",
    strokeVar: "var(--z-tarim-stroke)",
    defaultKaks: [0.05, 0.2],
    defaultTaks: [0.05, 0.15]
  },
  Kamu: {
    type: "Kamu",
    label: "Donatı / Kamu",
    shortLabel: "Donatı",
    subcategories: ["Eğitim Tesisi Alanı", "Sağlık Tesisi Alanı", "Belediye Hizmet Alanı", "Dini Tesis Alanı", "Spor Alanı"],
    commonConstraints: ["kurum görüşü gerekli", "otopark yönetmeliği", "çekme mesafesi 5 m"],
    fill: "#BFD8F2",
    stroke: "#2F5C8E",
    fillVar: "var(--z-kamu)",
    strokeVar: "var(--z-kamu-stroke)",
    defaultKaks: [0.5, 1.2],
    defaultTaks: [0.25, 0.4]
  },
  Turizm: {
    type: "Turizm",
    label: "Turizm Tesis Alanı",
    shortLabel: "Turizm",
    subcategories: ["Turizm Tesis Alanı", "Koruma Alanı / Sit Etkileşim"],
    commonConstraints: ["kıyı kenar çizgisi kontrolü", "yükseklik mania kriteri", "otopark yönetmeliği"],
    fill: "#FFD9B3",
    stroke: "#B5651D",
    fillVar: "var(--z-turizm)",
    strokeVar: "var(--z-turizm-stroke)",
    defaultKaks: [1.0, 2.4],
    defaultTaks: [0.3, 0.5]
  }
};

export const ZONING_TYPES = Object.keys(ZONING_PRESETS) as Array<
  keyof typeof ZONING_PRESETS
>;

export function getZoningPreset(type: string): ZoningPreset {
  return ZONING_PRESETS[type] ?? ZONING_PRESETS.Konut;
}
