/**
 * Şu anda askıda olan plan değişikliklerinin manuel listesi —
 * sidebar Watchlist + bildirim önerilerinde kullanılır.
 */
export interface AskiOzet {
  id: string;
  baslik: string;
  belediye: string;
  baslangic: string;
  bitis: string;
  durum: "askida" | "onaylandi" | "reddedildi";
  ilSlug: string;
  ilceSlug: string;
}

export const ASKI_LIST: AskiOzet[] = [
  {
    id: "askida-besiktas-revizyon",
    baslik: "Beşiktaş Levent 1234 Ada Revizyon UİP",
    belediye: "Beşiktaş Belediyesi",
    baslangic: "2026-04-15",
    bitis: "2026-06-14",
    durum: "askida",
    ilSlug: "istanbul",
    ilceSlug: "besiktas"
  },
  {
    id: "askida-cankaya-cukurambar",
    baslik: "Çankaya Çukurambar 1/1000 UİP Değişikliği",
    belediye: "Çankaya Belediyesi",
    baslangic: "2026-03-29",
    bitis: "2026-05-28",
    durum: "askida",
    ilSlug: "ankara",
    ilceSlug: "cankaya"
  },
  {
    id: "askida-konak-alsancak",
    baslik: "Konak Alsancak 7102 Ada UİP Tadilatı",
    belediye: "Konak Belediyesi",
    baslangic: "2026-04-08",
    bitis: "2026-06-07",
    durum: "askida",
    ilSlug: "izmir",
    ilceSlug: "konak"
  },
  {
    id: "onaylandi-nilufer-gorukle",
    baslik: "Nilüfer Görükle 1308 Ada UİP Onayı",
    belediye: "Nilüfer Belediyesi",
    baslangic: "2025-09-12",
    bitis: "2025-11-11",
    durum: "onaylandi",
    ilSlug: "bursa",
    ilceSlug: "nilufer"
  },
  {
    id: "reddedildi-muratpasa-lara",
    baslik: "Muratpaşa Lara 4502 Ada Tadilat Reddi",
    belediye: "Muratpaşa Belediyesi",
    baslangic: "2024-11-12",
    bitis: "2025-01-11",
    durum: "reddedildi",
    ilSlug: "antalya",
    ilceSlug: "muratpasa"
  }
];
