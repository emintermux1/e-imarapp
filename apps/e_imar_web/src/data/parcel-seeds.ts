import type { ZoningType } from "@/types/parcel";

export type DemoClusterKind = "central" | "mixed" | "residential" | "industrial" | "coastal" | "peripheral" | "agricultural";

export interface ParcelClusterSeed {
  id: string;
  il: string;
  ilce: string;
  mahalle: string;
  plaka: string;
  ilceCode: string;
  center: [number, number];
  count: number;
  kind: DemoClusterKind;
  adaBase: number;
  blockPrefix?: string;
  riskBase: 1 | 2 | 3 | 4 | 5;
  zoningBias: Partial<Record<ZoningType, number>>;
}

export const DEMO_PARCEL_CLUSTERS: ParcelClusterSeed[] = [
  { id: "ist-bes-levent", il: "İstanbul", ilce: "Beşiktaş", mahalle: "Levent", plaka: "34", ilceCode: "BES", center: [29.018, 41.0876], count: 135, kind: "central", adaBase: 1200, riskBase: 5, zoningBias: { Karma: 32, Ticaret: 28, Konut: 18, Turizm: 8, Kamu: 7, Yesil: 7 } },
  { id: "ist-sis-mecidiyekoy", il: "İstanbul", ilce: "Şişli", mahalle: "Mecidiyeköy", plaka: "34", ilceCode: "SIS", center: [29.0086, 41.0671], count: 145, kind: "central", adaBase: 1900, riskBase: 5, zoningBias: { Ticaret: 35, Karma: 32, Konut: 15, Kamu: 8, Turizm: 5, Yesil: 5 } },
  { id: "ist-kad-caddebostan", il: "İstanbul", ilce: "Kadıköy", mahalle: "Caddebostan", plaka: "34", ilceCode: "KAD", center: [29.0648, 40.9673], count: 125, kind: "coastal", adaBase: 3300, riskBase: 5, zoningBias: { Konut: 42, Ticaret: 18, Karma: 20, Turizm: 7, Yesil: 8, Kamu: 5 } },
  { id: "ist-usk-merkez", il: "İstanbul", ilce: "Üsküdar", mahalle: "Mimar Sinan", plaka: "34", ilceCode: "USK", center: [29.015, 41.0267], count: 105, kind: "mixed", adaBase: 2500, riskBase: 5, zoningBias: { Konut: 34, Karma: 24, Ticaret: 22, Kamu: 8, Yesil: 8, Turizm: 4 } },
  { id: "ist-beyoglu", il: "İstanbul", ilce: "Beyoğlu", mahalle: "Karaköy", plaka: "34", ilceCode: "BEY", center: [28.979, 41.0245], count: 105, kind: "central", adaBase: 410, riskBase: 5, zoningBias: { Ticaret: 38, Turizm: 20, Karma: 22, Konut: 8, Kamu: 7, Yesil: 5 } },
  { id: "ist-atasehir", il: "İstanbul", ilce: "Ataşehir", mahalle: "Barbaros", plaka: "34", ilceCode: "ATA", center: [29.106, 40.991], count: 115, kind: "central", adaBase: 5200, riskBase: 5, zoningBias: { Karma: 32, Ticaret: 28, Konut: 22, Kamu: 7, Yesil: 6, Turizm: 5 } },
  { id: "ist-bakirkoy", il: "İstanbul", ilce: "Bakırköy", mahalle: "Ataköy", plaka: "34", ilceCode: "BAK", center: [28.857, 40.977], count: 95, kind: "coastal", adaBase: 6100, riskBase: 5, zoningBias: { Konut: 34, Karma: 22, Ticaret: 20, Turizm: 10, Yesil: 9, Kamu: 5 } },
  { id: "ist-basaksehir", il: "İstanbul", ilce: "Başakşehir", mahalle: "Başak", plaka: "34", ilceCode: "BAS", center: [28.806, 41.093], count: 100, kind: "peripheral", adaBase: 7200, riskBase: 4, zoningBias: { Konut: 44, Sanayi: 16, Kamu: 12, Ticaret: 12, Yesil: 8, Tarim: 8 } },
  { id: "ist-pendik-kurtkoy", il: "İstanbul", ilce: "Pendik", mahalle: "Kurtköy", plaka: "34", ilceCode: "PEN", center: [29.302, 40.932], count: 80, kind: "mixed", adaBase: 8300, riskBase: 4, zoningBias: { Konut: 38, Karma: 20, Ticaret: 14, Sanayi: 10, Kamu: 10, Yesil: 8 } },
  { id: "ist-esenler-menderes", il: "İstanbul", ilce: "Esenler", mahalle: "Menderes", plaka: "34", ilceCode: "ESN", center: [28.876, 41.043], count: 70, kind: "residential", adaBase: 8600, riskBase: 4, zoningBias: { Konut: 46, Ticaret: 14, Karma: 14, Kamu: 10, Yesil: 8, Sanayi: 8 } },
  { id: "ist-sultangazi-50yil", il: "İstanbul", ilce: "Sultangazi", mahalle: "50. Yıl", plaka: "34", ilceCode: "SUL", center: [28.874, 41.104], count: 65, kind: "peripheral", adaBase: 8900, riskBase: 4, zoningBias: { Konut: 48, Ticaret: 12, Karma: 12, Kamu: 10, Yesil: 10, Sanayi: 8 } },

  { id: "ank-cankaya-kavaklidere", il: "Ankara", ilce: "Çankaya", mahalle: "Kavaklıdere", plaka: "06", ilceCode: "CAN", center: [32.858, 39.9105], count: 135, kind: "central", adaBase: 2100, riskBase: 2, zoningBias: { Ticaret: 34, Karma: 30, Konut: 18, Kamu: 9, Turizm: 4, Yesil: 5 } },
  { id: "ank-cukurambar", il: "Ankara", ilce: "Çankaya", mahalle: "Çukurambar", plaka: "06", ilceCode: "CAN", center: [32.811, 39.9075], count: 120, kind: "central", adaBase: 2400, riskBase: 2, zoningBias: { Karma: 36, Ticaret: 26, Konut: 24, Kamu: 8, Yesil: 6 } },
  { id: "ank-yenimahalle", il: "Ankara", ilce: "Yenimahalle", mahalle: "Demetevler", plaka: "06", ilceCode: "YEN", center: [32.79, 39.9705], count: 110, kind: "residential", adaBase: 3100, riskBase: 2, zoningBias: { Konut: 50, Ticaret: 16, Karma: 14, Kamu: 10, Yesil: 8, Sanayi: 2 } },
  { id: "ank-kecioren", il: "Ankara", ilce: "Keçiören", mahalle: "Etlik", plaka: "06", ilceCode: "KEC", center: [32.858, 39.986], count: 95, kind: "residential", adaBase: 4200, riskBase: 2, zoningBias: { Konut: 56, Ticaret: 14, Karma: 12, Kamu: 10, Yesil: 8 } },
  { id: "ank-etimesgut", il: "Ankara", ilce: "Etimesgut", mahalle: "Eryaman", plaka: "06", ilceCode: "ETI", center: [32.64, 39.969], count: 90, kind: "peripheral", adaBase: 5300, riskBase: 2, zoningBias: { Konut: 48, Kamu: 14, Ticaret: 12, Karma: 10, Yesil: 10, Tarim: 6 } },
  { id: "ank-kahramankazan-merkez", il: "Ankara", ilce: "Kahramankazan", mahalle: "Satıkadın", plaka: "06", ilceCode: "KAZ", center: [32.684, 40.231], count: 55, kind: "peripheral", adaBase: 5600, riskBase: 2, zoningBias: { Konut: 42, Sanayi: 18, Kamu: 12, Ticaret: 12, Tarim: 10, Yesil: 6 } },

  { id: "izm-konak-alsancak", il: "İzmir", ilce: "Konak", mahalle: "Alsancak", plaka: "35", ilceCode: "KON", center: [27.144, 38.4295], count: 125, kind: "coastal", adaBase: 7100, riskBase: 5, zoningBias: { Ticaret: 32, Karma: 28, Turizm: 14, Konut: 14, Kamu: 6, Yesil: 6 } },
  { id: "izm-karsiyaka-bostanli", il: "İzmir", ilce: "Karşıyaka", mahalle: "Bostanlı", plaka: "35", ilceCode: "KAR", center: [27.096, 38.458], count: 105, kind: "coastal", adaBase: 8100, riskBase: 5, zoningBias: { Konut: 38, Ticaret: 20, Karma: 20, Turizm: 9, Yesil: 8, Kamu: 5 } },
  { id: "izm-bornova", il: "İzmir", ilce: "Bornova", mahalle: "Kazımdirik", plaka: "35", ilceCode: "BOR", center: [27.218, 38.463], count: 105, kind: "mixed", adaBase: 9100, riskBase: 4, zoningBias: { Konut: 34, Ticaret: 20, Karma: 20, Sanayi: 10, Kamu: 8, Yesil: 8 } },
  { id: "izm-bayrakli", il: "İzmir", ilce: "Bayraklı", mahalle: "Adalet", plaka: "35", ilceCode: "BAY", center: [27.166, 38.462], count: 100, kind: "central", adaBase: 10100, riskBase: 5, zoningBias: { Karma: 34, Ticaret: 30, Konut: 18, Kamu: 8, Yesil: 6, Turizm: 4 } },
  { id: "izm-balcova", il: "İzmir", ilce: "Balçova", mahalle: "İnciraltı", plaka: "35", ilceCode: "BAL", center: [27.045, 38.393], count: 80, kind: "coastal", adaBase: 11100, riskBase: 4, zoningBias: { Turizm: 24, Konut: 24, Ticaret: 18, Karma: 16, Yesil: 10, Tarim: 8 } },

  { id: "bur-nilufer", il: "Bursa", ilce: "Nilüfer", mahalle: "Görükle", plaka: "16", ilceCode: "NIL", center: [28.853, 40.222], count: 115, kind: "mixed", adaBase: 1300, riskBase: 4, zoningBias: { Konut: 34, Karma: 20, Sanayi: 16, Ticaret: 14, Kamu: 8, Yesil: 8 } },
  { id: "bur-osmangazi", il: "Bursa", ilce: "Osmangazi", mahalle: "Heykel", plaka: "16", ilceCode: "OSM", center: [29.061, 40.184], count: 105, kind: "central", adaBase: 2300, riskBase: 4, zoningBias: { Ticaret: 30, Karma: 26, Konut: 22, Turizm: 8, Kamu: 8, Yesil: 6 } },
  { id: "bur-yildirim", il: "Bursa", ilce: "Yıldırım", mahalle: "Duaçınarı", plaka: "16", ilceCode: "YIL", center: [29.104, 40.188], count: 90, kind: "residential", adaBase: 3300, riskBase: 4, zoningBias: { Konut: 48, Sanayi: 14, Ticaret: 14, Karma: 10, Kamu: 8, Yesil: 6 } },

  { id: "ant-muratpasa-lara", il: "Antalya", ilce: "Muratpaşa", mahalle: "Lara", plaka: "07", ilceCode: "MUR", center: [30.766, 36.8595], count: 115, kind: "coastal", adaBase: 4500, riskBase: 3, zoningBias: { Turizm: 28, Konut: 26, Ticaret: 18, Karma: 16, Yesil: 7, Kamu: 5 } },
  { id: "ant-konyaalti", il: "Antalya", ilce: "Konyaaltı", mahalle: "Liman", plaka: "07", ilceCode: "KON", center: [30.653, 36.861], count: 100, kind: "coastal", adaBase: 5500, riskBase: 3, zoningBias: { Konut: 34, Turizm: 24, Ticaret: 16, Karma: 14, Yesil: 8, Kamu: 4 } },
  { id: "ant-kepez", il: "Antalya", ilce: "Kepez", mahalle: "Varsak", plaka: "07", ilceCode: "KEP", center: [30.742, 36.943], count: 90, kind: "peripheral", adaBase: 6500, riskBase: 3, zoningBias: { Konut: 42, Ticaret: 14, Sanayi: 12, Kamu: 12, Yesil: 10, Tarim: 10 } },
  { id: "ant-alanya-saray", il: "Antalya", ilce: "Alanya", mahalle: "Saray", plaka: "07", ilceCode: "ALA", center: [31.995, 36.544], count: 70, kind: "coastal", adaBase: 6800, riskBase: 3, zoningBias: { Turizm: 28, Konut: 28, Ticaret: 16, Karma: 12, Yesil: 10, Kamu: 6 } },

  { id: "adn-seyhan", il: "Adana", ilce: "Seyhan", mahalle: "Reşatbey", plaka: "01", ilceCode: "SEY", center: [35.321, 36.993], count: 70, kind: "central", adaBase: 1500, riskBase: 4, zoningBias: { Ticaret: 28, Karma: 24, Konut: 24, Kamu: 8, Yesil: 8, Sanayi: 8 } },
  { id: "mer-yenisehir", il: "Mersin", ilce: "Yenişehir", mahalle: "Pozcu", plaka: "33", ilceCode: "YEN", center: [34.595, 36.787], count: 70, kind: "coastal", adaBase: 1700, riskBase: 3, zoningBias: { Konut: 32, Ticaret: 22, Karma: 20, Turizm: 12, Yesil: 8, Kamu: 6 } },
  { id: "kon-selcuklu", il: "Konya", ilce: "Selçuklu", mahalle: "Bosna Hersek", plaka: "42", ilceCode: "SEL", center: [32.484, 37.949], count: 65, kind: "peripheral", adaBase: 1900, riskBase: 1, zoningBias: { Konut: 42, Kamu: 14, Ticaret: 12, Karma: 10, Tarim: 12, Yesil: 10 } },
  { id: "kay-melikgazi", il: "Kayseri", ilce: "Melikgazi", mahalle: "Alpaslan", plaka: "38", ilceCode: "MEL", center: [35.485, 38.722], count: 65, kind: "mixed", adaBase: 2100, riskBase: 2, zoningBias: { Konut: 38, Ticaret: 18, Karma: 16, Sanayi: 12, Kamu: 8, Yesil: 8 } },
  { id: "sam-atakum", il: "Samsun", ilce: "Atakum", mahalle: "Mimarsinan", plaka: "55", ilceCode: "ATA", center: [36.286, 41.344], count: 60, kind: "coastal", adaBase: 2300, riskBase: 2, zoningBias: { Konut: 36, Ticaret: 18, Karma: 16, Turizm: 12, Kamu: 8, Yesil: 10 } },
  { id: "tra-ortahisar", il: "Trabzon", ilce: "Ortahisar", mahalle: "Kemerkaya", plaka: "61", ilceCode: "ORT", center: [39.72, 41.004], count: 60, kind: "coastal", adaBase: 2500, riskBase: 3, zoningBias: { Ticaret: 26, Konut: 24, Karma: 20, Turizm: 14, Kamu: 8, Yesil: 8 } },
  { id: "gaz-sehitkamil", il: "Gaziantep", ilce: "Şehitkamil", mahalle: "Mücahitler", plaka: "27", ilceCode: "SEH", center: [37.378, 37.083], count: 65, kind: "central", adaBase: 2700, riskBase: 3, zoningBias: { Ticaret: 24, Karma: 22, Konut: 22, Sanayi: 14, Kamu: 10, Yesil: 8 } },
  { id: "esk-tepebasi", il: "Eskişehir", ilce: "Tepebaşı", mahalle: "Hoşnudiye", plaka: "26", ilceCode: "TEP", center: [30.516, 39.779], count: 65, kind: "central", adaBase: 2900, riskBase: 2, zoningBias: { Ticaret: 26, Karma: 24, Konut: 24, Kamu: 10, Turizm: 6, Yesil: 10 } },
  { id: "koc-izmit", il: "Kocaeli", ilce: "İzmit", mahalle: "Yenişehir", plaka: "41", ilceCode: "IZM", center: [29.965, 40.766], count: 75, kind: "industrial", adaBase: 3100, riskBase: 5, zoningBias: { Sanayi: 30, Konut: 24, Ticaret: 18, Karma: 12, Kamu: 8, Yesil: 8 } },
  { id: "can-merkez-barbaros", il: "Çanakkale", ilce: "Merkez", mahalle: "Barbaros", plaka: "17", ilceCode: "MER", center: [26.408, 40.155], count: 55, kind: "coastal", adaBase: 3400, riskBase: 3, zoningBias: { Konut: 34, Turizm: 18, Ticaret: 16, Karma: 16, Kamu: 8, Yesil: 8 } },
  { id: "tek-cerkezkoy-gazi", il: "Tekirdağ", ilce: "Çerkezköy", mahalle: "Gazi Osman Paşa", plaka: "59", ilceCode: "CER", center: [27.999, 41.286], count: 65, kind: "industrial", adaBase: 3700, riskBase: 3, zoningBias: { Sanayi: 32, Konut: 24, Ticaret: 16, Karma: 12, Kamu: 8, Yesil: 8 } },
  { id: "den-pamukkale-kinikli", il: "Denizli", ilce: "Pamukkale", mahalle: "Kınıklı", plaka: "20", ilceCode: "PAM", center: [29.099, 37.776], count: 60, kind: "residential", adaBase: 3900, riskBase: 2, zoningBias: { Konut: 44, Ticaret: 16, Karma: 14, Kamu: 10, Yesil: 10, Tarim: 6 } },
  { id: "den-merkezefendi-sumer", il: "Denizli", ilce: "Merkezefendi", mahalle: "Sümer", plaka: "20", ilceCode: "MRK", center: [29.087, 37.783], count: 60, kind: "mixed", adaBase: 4100, riskBase: 2, zoningBias: { Konut: 36, Ticaret: 18, Karma: 18, Sanayi: 10, Kamu: 10, Yesil: 8 } },
  { id: "ord-altinordu-bahcelievler", il: "Ordu", ilce: "Altınordu", mahalle: "Bahçelievler", plaka: "52", ilceCode: "ALT", center: [37.879, 40.986], count: 55, kind: "coastal", adaBase: 4300, riskBase: 3, zoningBias: { Konut: 40, Ticaret: 18, Karma: 16, Turizm: 10, Kamu: 8, Yesil: 8 } },
  { id: "aks-merkez-carsi", il: "Aksaray", ilce: "Merkez", mahalle: "Çarşı", plaka: "68", ilceCode: "MRK", center: [34.028, 38.372], count: 55, kind: "central", adaBase: 4500, riskBase: 2, zoningBias: { Konut: 38, Ticaret: 20, Karma: 16, Kamu: 12, Yesil: 8, Sanayi: 6 } },
  { id: "van-tusba-bahcivan", il: "Van", ilce: "Tuşba", mahalle: "Bahçıvan", plaka: "65", ilceCode: "TUS", center: [43.38, 38.494], count: 50, kind: "peripheral", adaBase: 4700, riskBase: 3, zoningBias: { Konut: 42, Ticaret: 16, Karma: 14, Kamu: 12, Yesil: 8, Tarim: 8 } }
];

export const DEMO_CLUSTER_TOTAL = DEMO_PARCEL_CLUSTERS.reduce((sum, c) => sum + c.count, 0);
