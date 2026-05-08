export interface District {
  ilSlug: string;
  slug: string;
  name: string;
  centroid: [number, number];
}

export const DISTRICTS: District[] = [
  // İstanbul
  { ilSlug: "istanbul", slug: "besiktas", name: "Beşiktaş", centroid: [29.005, 41.043] },
  { ilSlug: "istanbul", slug: "kadikoy", name: "Kadıköy", centroid: [29.062, 40.99] },
  { ilSlug: "istanbul", slug: "sisli", name: "Şişli", centroid: [28.987, 41.06] },
  { ilSlug: "istanbul", slug: "uskudar", name: "Üsküdar", centroid: [29.022, 41.025] },
  { ilSlug: "istanbul", slug: "fatih", name: "Fatih", centroid: [28.95, 41.018] },
  { ilSlug: "istanbul", slug: "beyoglu", name: "Beyoğlu", centroid: [28.978, 41.036] },
  { ilSlug: "istanbul", slug: "bakirkoy", name: "Bakırköy", centroid: [28.873, 40.978] },
  // Ankara
  { ilSlug: "ankara", slug: "cankaya", name: "Çankaya", centroid: [32.86, 39.91] },
  { ilSlug: "ankara", slug: "yenimahalle", name: "Yenimahalle", centroid: [32.78, 39.96] },
  { ilSlug: "ankara", slug: "kecioren", name: "Keçiören", centroid: [32.86, 39.98] },
  { ilSlug: "ankara", slug: "etimesgut", name: "Etimesgut", centroid: [32.66, 39.95] },
  // İzmir
  { ilSlug: "izmir", slug: "konak", name: "Konak", centroid: [27.144, 38.418] },
  { ilSlug: "izmir", slug: "karsiyaka", name: "Karşıyaka", centroid: [27.108, 38.46] },
  { ilSlug: "izmir", slug: "bornova", name: "Bornova", centroid: [27.214, 38.47] },
  { ilSlug: "izmir", slug: "buca", name: "Buca", centroid: [27.18, 38.39] },
  // Bursa
  { ilSlug: "bursa", slug: "nilufer", name: "Nilüfer", centroid: [28.93, 40.215] },
  { ilSlug: "bursa", slug: "osmangazi", name: "Osmangazi", centroid: [29.06, 40.18] },
  { ilSlug: "bursa", slug: "yildirim", name: "Yıldırım", centroid: [29.14, 40.2] },
  // Antalya
  { ilSlug: "antalya", slug: "muratpasa", name: "Muratpaşa", centroid: [30.715, 36.88] },
  { ilSlug: "antalya", slug: "konyaalti", name: "Konyaaltı", centroid: [30.65, 36.87] },
  // Adana
  { ilSlug: "adana", slug: "seyhan", name: "Seyhan", centroid: [35.32, 37.0] },
  { ilSlug: "adana", slug: "yuregir", name: "Yüreğir", centroid: [35.36, 36.97] },
  // Mersin
  { ilSlug: "mersin", slug: "yenisehir", name: "Yenişehir", centroid: [34.62, 36.81] },
  { ilSlug: "mersin", slug: "mezitli", name: "Mezitli", centroid: [34.55, 36.74] },
  // Samsun
  { ilSlug: "samsun", slug: "atakum", name: "Atakum", centroid: [36.27, 41.31] },
  { ilSlug: "samsun", slug: "ilkadim", name: "İlkadım", centroid: [36.33, 41.29] },
  // Trabzon
  { ilSlug: "trabzon", slug: "ortahisar", name: "Ortahisar", centroid: [39.72, 40.99] },
  // Konya
  { ilSlug: "konya", slug: "selcuklu", name: "Selçuklu", centroid: [32.49, 37.93] },
  { ilSlug: "konya", slug: "meram", name: "Meram", centroid: [32.45, 37.86] },
  // Kayseri
  { ilSlug: "kayseri", slug: "melikgazi", name: "Melikgazi", centroid: [35.51, 38.73] }
];
