export interface Province {
  code: string; // plaka
  slug: string;
  name: string;
  centroid: [number, number]; // [lng, lat]
}

export const PROVINCES: Province[] = [
  { code: "34", slug: "istanbul", name: "İstanbul", centroid: [28.978, 41.015] },
  { code: "06", slug: "ankara", name: "Ankara", centroid: [32.86, 39.92] },
  { code: "35", slug: "izmir", name: "İzmir", centroid: [27.142, 38.418] },
  { code: "16", slug: "bursa", name: "Bursa", centroid: [28.97, 40.184] },
  { code: "07", slug: "antalya", name: "Antalya", centroid: [30.71, 36.897] },
  { code: "01", slug: "adana", name: "Adana", centroid: [35.328, 37.0] },
  { code: "33", slug: "mersin", name: "Mersin", centroid: [34.62, 36.81] },
  { code: "55", slug: "samsun", name: "Samsun", centroid: [36.331, 41.292] },
  { code: "61", slug: "trabzon", name: "Trabzon", centroid: [39.72, 41.0] },
  { code: "44", slug: "malatya", name: "Malatya", centroid: [38.32, 38.355] },
  { code: "42", slug: "konya", name: "Konya", centroid: [32.49, 37.872] },
  { code: "38", slug: "kayseri", name: "Kayseri", centroid: [35.49, 38.731] }
];
