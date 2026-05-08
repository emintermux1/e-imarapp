/**
 * Emsal hesaplayıcısı — TKGM ve İmar Yönetmeliği temelli yapılaşma
 * göstergelerinden inşaat alanı, daire sayısı, maliyet, gelir ve ROI üretir.
 *
 * Bu modül, mobil uygulamadaki Dart implementasyonuna paralel bir
 * TypeScript portudur. Anahtar isimlendirmeler ve formüller mobil
 * uygulamayla aynı tutulmuştur.
 */

export interface EmsalInput {
  /** Arsa yüzölçümü (m²) */
  arsaM2: number;
  /** Taban Alanı Katsayısı, 0..1 */
  taks: number;
  /** Kat Alanı Katsayısı / Emsal */
  kaks: number;
  /** Maks. yapı yüksekliği — m */
  gabariM: number;
  /** Ortalama kat yüksekliği — m (varsayılan 3) */
  katYuksekligiM?: number;
  /** Ortalama daire alanı — m² (varsayılan 90) */
  ortalamaDaireM2?: number;
  /** m² inşaat maliyeti — ₺ */
  insaatMaliyetiM2: number;
  /** m² satış fiyatı — ₺ */
  satisFiyatiM2: number;
  /** Yol cephesi — m (opsiyonel; bilgilendirme için) */
  yolCephesiM?: number;
  /** Gabari aşımı tolerans — m (varsayılan 0.5) */
  gabariTolerans?: number;
}

export interface EmsalResult {
  /** Maks. taban alanı (m²) — TAKS × arsa */
  tabanAlaniM2: number;
  /** Toplam inşaat alanı (m²) — KAKS × arsa */
  toplamYapiAlaniM2: number;
  /** Hesaplanan kat sayısı — gabari ÷ kat yüksekliği */
  hesaplananKatSayisi: number;
  /** Etkin kat alanına denk gelen daire sayısı */
  daireSayisi: number;
  /** Toplam tahmini inşaat maliyeti (₺) */
  insaatMaliyetiTL: number;
  /** Toplam tahmini satış geliri (₺) */
  tahminiSatisGeliriTL: number;
  /** Brüt kar (₺) */
  brutKarTL: number;
  /** ROI yüzde — net gelir / maliyet × 100 */
  roiYuzde: number;
  /** Ortalama daire başı brüt kar (₺) */
  daireBasiBrutKarTL: number;
  /** Yapılaşma uyarıları */
  uyarilar: string[];
}

const DEFAULTS = {
  katYuksekligiM: 3,
  ortalamaDaireM2: 90,
  gabariTolerans: 0.5
} as const;

function pushUyari(list: string[], msg: string) {
  list.push(msg);
}

export function validateEmsalInput(input: EmsalInput): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.arsaM2) || input.arsaM2 <= 0) {
    errors.push("Arsa yüzölçümü 0'dan büyük olmalıdır.");
  }
  if (!Number.isFinite(input.taks) || input.taks <= 0 || input.taks > 1) {
    errors.push("TAKS 0 ile 1 arasında bir değer olmalıdır.");
  }
  if (!Number.isFinite(input.kaks) || input.kaks <= 0) {
    errors.push("KAKS / Emsal 0'dan büyük olmalıdır.");
  }
  if (!Number.isFinite(input.gabariM) || input.gabariM <= 0) {
    errors.push("Gabari (yapı yüksekliği) 0'dan büyük olmalıdır.");
  }
  if (
    !Number.isFinite(input.insaatMaliyetiM2) ||
    input.insaatMaliyetiM2 <= 0
  ) {
    errors.push("İnşaat maliyeti 0'dan büyük olmalıdır.");
  }
  if (!Number.isFinite(input.satisFiyatiM2) || input.satisFiyatiM2 <= 0) {
    errors.push("Satış fiyatı 0'dan büyük olmalıdır.");
  }
  if (input.kaks > 0 && input.taks > 0 && input.kaks < input.taks) {
    errors.push(
      "KAKS, TAKS değerinden küçük olamaz. Emsal en az TAKS kadar olmalıdır."
    );
  }
  return errors;
}

export function computeEmsal(rawInput: EmsalInput): EmsalResult {
  const input: Required<EmsalInput> = {
    katYuksekligiM: DEFAULTS.katYuksekligiM,
    ortalamaDaireM2: DEFAULTS.ortalamaDaireM2,
    gabariTolerans: DEFAULTS.gabariTolerans,
    yolCephesiM: 0,
    ...rawInput
  };

  const tabanAlaniM2 = input.arsaM2 * input.taks;
  const toplamYapiAlaniM2 = input.arsaM2 * input.kaks;

  // Net kullanılabilir alanı yaklaşık %80 ortak alan düşümüyle hesapla
  // (emsal ham toplam alandır; daire sayısını hesaplarken gerçekçilik için
  // ortak alan/duvar kaybı çıkarılır).
  const ortakAlanFire = 0.2;
  const netDaireAlani = toplamYapiAlaniM2 * (1 - ortakAlanFire);
  const daireSayisi = Math.max(
    0,
    Math.floor(netDaireAlani / input.ortalamaDaireM2)
  );

  const hesaplananKatSayisi = Math.max(
    1,
    Math.floor(input.gabariM / input.katYuksekligiM)
  );

  const insaatMaliyetiTL = toplamYapiAlaniM2 * input.insaatMaliyetiM2;
  const tahminiSatisGeliriTL = toplamYapiAlaniM2 * input.satisFiyatiM2;
  const brutKarTL = tahminiSatisGeliriTL - insaatMaliyetiTL;
  const roiYuzde =
    insaatMaliyetiTL > 0 ? (brutKarTL / insaatMaliyetiTL) * 100 : 0;
  const daireBasiBrutKarTL =
    daireSayisi > 0 ? brutKarTL / daireSayisi : 0;

  const uyarilar: string[] = [];

  // KAKS, TAKS ve gabari etkileşim uyarıları
  const tabandanGelenKaks = input.taks * hesaplananKatSayisi;
  if (input.kaks > tabandanGelenKaks + 0.05) {
    pushUyari(
      uyarilar,
      `Emsal (${input.kaks.toFixed(2)}) gabarinin izin verdiği yoğunluğun (${tabandanGelenKaks.toFixed(2)}) üzerinde. Gabari yetersiz olabilir.`
    );
  }
  if (input.taks > 0.6) {
    pushUyari(
      uyarilar,
      `TAKS (${input.taks.toFixed(2)}) yoğun yapılaşmaya işaret ediyor; bahçe mesafesi yönetmeliği değerlendirilmeli.`
    );
  }
  if (
    Number.isFinite(input.yolCephesiM) &&
    input.yolCephesiM > 0 &&
    input.yolCephesiM < 6
  ) {
    pushUyari(
      uyarilar,
      `Yol cephesi (${input.yolCephesiM} m) ayrık nizam için sınırda; konut çekme mesafesi azalabilir.`
    );
  }
  if (hesaplananKatSayisi >= 8 && input.gabariM < hesaplananKatSayisi * 3.2) {
    pushUyari(
      uyarilar,
      `Yüksek kat sayısı için gabari sınırlayıcı. Asma kat / dubleks revizesini değerlendirin.`
    );
  }
  if (input.kaks <= 0.6) {
    pushUyari(
      uyarilar,
      `Düşük emsal: parselin verimliliği düşük; karma kullanım veya birleşme analizi yapılabilir.`
    );
  }
  if (roiYuzde < 5) {
    pushUyari(
      uyarilar,
      `ROI %5'in altında. Maliyet veya satış fiyatı varsayımları gözden geçirilmeli.`
    );
  }

  return {
    tabanAlaniM2,
    toplamYapiAlaniM2,
    hesaplananKatSayisi,
    daireSayisi,
    insaatMaliyetiTL,
    tahminiSatisGeliriTL,
    brutKarTL,
    roiYuzde,
    daireBasiBrutKarTL,
    uyarilar
  };
}

export const EMSAL_DEFAULTS = DEFAULTS;
