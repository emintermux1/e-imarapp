export interface BelediyeRecord {
  id: string;
  ad: string;
  ilSlug: string;
}

export const BELEDIYE_LIST: BelediyeRecord[] = [
  { id: "ibb", ad: "İstanbul Büyükşehir Belediyesi", ilSlug: "istanbul" },
  { id: "besiktas", ad: "Beşiktaş Belediyesi", ilSlug: "istanbul" },
  { id: "kadikoy", ad: "Kadıköy Belediyesi", ilSlug: "istanbul" },
  { id: "sisli", ad: "Şişli Belediyesi", ilSlug: "istanbul" },
  { id: "uskudar", ad: "Üsküdar Belediyesi", ilSlug: "istanbul" },
  { id: "beyoglu", ad: "Beyoğlu Belediyesi", ilSlug: "istanbul" },
  { id: "abb", ad: "Ankara Büyükşehir Belediyesi", ilSlug: "ankara" },
  { id: "cankaya", ad: "Çankaya Belediyesi", ilSlug: "ankara" },
  { id: "yenimahalle", ad: "Yenimahalle Belediyesi", ilSlug: "ankara" },
  { id: "izmirbb", ad: "İzmir Büyükşehir Belediyesi", ilSlug: "izmir" },
  { id: "konak", ad: "Konak Belediyesi", ilSlug: "izmir" },
  { id: "karsiyaka", ad: "Karşıyaka Belediyesi", ilSlug: "izmir" },
  { id: "bornova", ad: "Bornova Belediyesi", ilSlug: "izmir" },
  { id: "bursabb", ad: "Bursa Büyükşehir Belediyesi", ilSlug: "bursa" },
  { id: "nilufer", ad: "Nilüfer Belediyesi", ilSlug: "bursa" },
  { id: "osmangazi", ad: "Osmangazi Belediyesi", ilSlug: "bursa" },
  { id: "antalyabb", ad: "Antalya Büyükşehir Belediyesi", ilSlug: "antalya" },
  { id: "muratpasa", ad: "Muratpaşa Belediyesi", ilSlug: "antalya" },
  { id: "konyaalti", ad: "Konyaaltı Belediyesi", ilSlug: "antalya" },
  { id: "adanabb", ad: "Adana Büyükşehir Belediyesi", ilSlug: "adana" },
  { id: "seyhan", ad: "Seyhan Belediyesi", ilSlug: "adana" }
];
