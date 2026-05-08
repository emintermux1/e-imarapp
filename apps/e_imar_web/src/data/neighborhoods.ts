export interface Neighborhood {
  ilSlug: string;
  ilceSlug: string;
  slug: string;
  name: string;
  centroid: [number, number];
}

export const NEIGHBORHOODS: Neighborhood[] = [
  // Beşiktaş
  { ilSlug: "istanbul", ilceSlug: "besiktas", slug: "levent", name: "Levent", centroid: [29.014, 41.083] },
  { ilSlug: "istanbul", ilceSlug: "besiktas", slug: "etiler", name: "Etiler", centroid: [29.027, 41.082] },
  { ilSlug: "istanbul", ilceSlug: "besiktas", slug: "ortakoy", name: "Ortaköy", centroid: [29.027, 41.054] },
  { ilSlug: "istanbul", ilceSlug: "besiktas", slug: "bebek", name: "Bebek", centroid: [29.04, 41.077] },
  { ilSlug: "istanbul", ilceSlug: "besiktas", slug: "akatlar", name: "Akatlar", centroid: [29.022, 41.077] },
  // Kadıköy
  { ilSlug: "istanbul", ilceSlug: "kadikoy", slug: "caddebostan", name: "Caddebostan", centroid: [29.063, 40.965] },
  { ilSlug: "istanbul", ilceSlug: "kadikoy", slug: "fenerbahce", name: "Fenerbahçe", centroid: [29.046, 40.971] },
  { ilSlug: "istanbul", ilceSlug: "kadikoy", slug: "moda", name: "Moda", centroid: [29.027, 40.984] },
  { ilSlug: "istanbul", ilceSlug: "kadikoy", slug: "suadiye", name: "Suadiye", centroid: [29.077, 40.957] },
  // Şişli
  { ilSlug: "istanbul", ilceSlug: "sisli", slug: "mecidiyekoy", name: "Mecidiyeköy", centroid: [28.998, 41.067] },
  { ilSlug: "istanbul", ilceSlug: "sisli", slug: "nisantasi", name: "Nişantaşı", centroid: [28.99, 41.05] },
  { ilSlug: "istanbul", ilceSlug: "sisli", slug: "tesvikiye", name: "Teşvikiye", centroid: [28.991, 41.046] },
  // Üsküdar
  { ilSlug: "istanbul", ilceSlug: "uskudar", slug: "kuzguncuk", name: "Kuzguncuk", centroid: [29.032, 41.038] },
  { ilSlug: "istanbul", ilceSlug: "uskudar", slug: "altunizade", name: "Altunizade", centroid: [29.05, 41.022] },
  // Beyoğlu
  { ilSlug: "istanbul", ilceSlug: "beyoglu", slug: "cihangir", name: "Cihangir", centroid: [28.985, 41.033] },
  { ilSlug: "istanbul", ilceSlug: "beyoglu", slug: "galata", name: "Galata", centroid: [28.973, 41.025] },
  // Çankaya
  { ilSlug: "ankara", ilceSlug: "cankaya", slug: "kavaklidere", name: "Kavaklıdere", centroid: [32.864, 39.905] },
  { ilSlug: "ankara", ilceSlug: "cankaya", slug: "gaziosmanpasa", name: "Gaziosmanpaşa", centroid: [32.866, 39.9] },
  { ilSlug: "ankara", ilceSlug: "cankaya", slug: "bahcelievler", name: "Bahçelievler", centroid: [32.836, 39.927] },
  { ilSlug: "ankara", ilceSlug: "cankaya", slug: "cukurambar", name: "Çukurambar", centroid: [32.79, 39.91] },
  // Yenimahalle
  { ilSlug: "ankara", ilceSlug: "yenimahalle", slug: "demetevler", name: "Demetevler", centroid: [32.78, 39.965] },
  { ilSlug: "ankara", ilceSlug: "yenimahalle", slug: "batikent", name: "Batıkent", centroid: [32.71, 39.985] },
  // Konak
  { ilSlug: "izmir", ilceSlug: "konak", slug: "alsancak", name: "Alsancak", centroid: [27.142, 38.435] },
  { ilSlug: "izmir", ilceSlug: "konak", slug: "guzelyali", name: "Güzelyalı", centroid: [27.13, 38.41] },
  // Karşıyaka
  { ilSlug: "izmir", ilceSlug: "karsiyaka", slug: "bostanli", name: "Bostanlı", centroid: [27.105, 38.466] },
  { ilSlug: "izmir", ilceSlug: "karsiyaka", slug: "mavisehir", name: "Mavişehir", centroid: [27.085, 38.475] },
  // Bornova
  { ilSlug: "izmir", ilceSlug: "bornova", slug: "ergene", name: "Ergene", centroid: [27.215, 38.475] },
  // Nilüfer
  { ilSlug: "bursa", ilceSlug: "nilufer", slug: "gorukle", name: "Görükle", centroid: [28.876, 40.226] },
  { ilSlug: "bursa", ilceSlug: "nilufer", slug: "ozluce", name: "Özlüce", centroid: [28.93, 40.214] },
  // Osmangazi
  { ilSlug: "bursa", ilceSlug: "osmangazi", slug: "soganli", name: "Soğanlı", centroid: [29.05, 40.19] },
  // Muratpaşa
  { ilSlug: "antalya", ilceSlug: "muratpasa", slug: "lara", name: "Lara", centroid: [30.788, 36.86] },
  { ilSlug: "antalya", ilceSlug: "muratpasa", slug: "kaleici", name: "Kaleiçi", centroid: [30.7, 36.885] },
  // Konyaaltı
  { ilSlug: "antalya", ilceSlug: "konyaalti", slug: "liman", name: "Liman", centroid: [30.65, 36.86] },
  // Seyhan
  { ilSlug: "adana", ilceSlug: "seyhan", slug: "cemalpasa", name: "Cemalpaşa", centroid: [35.323, 37.0] },
  // Yenişehir (Mersin)
  { ilSlug: "mersin", ilceSlug: "yenisehir", slug: "barbaros", name: "Barbaros", centroid: [34.62, 36.815] },
  // Atakum
  { ilSlug: "samsun", ilceSlug: "atakum", slug: "denizevleri", name: "Denizevleri", centroid: [36.265, 41.32] },
  // Ortahisar
  { ilSlug: "trabzon", ilceSlug: "ortahisar", slug: "boztepe", name: "Boztepe", centroid: [39.722, 40.985] },
  // Selçuklu
  { ilSlug: "konya", ilceSlug: "selcuklu", slug: "yazir", name: "Yazır", centroid: [32.495, 37.945] },
  // Melikgazi
  { ilSlug: "kayseri", ilceSlug: "melikgazi", slug: "anbar", name: "Anbar", centroid: [35.51, 38.71] }
];
