/**
 * Şehir geneli plan notu havuzu — parsel düzeyi notlar `parcels.geo.json`
 * içinde gömülüdür. Bu dosya, filtre/arama önerileri için ortak başlıkları
 * tutar.
 */
export interface PlanNoteCategory {
  id: string;
  title: string;
  description: string;
}

export const PLAN_NOTE_CATEGORIES: PlanNoteCategory[] = [
  {
    id: "kn-cekme",
    title: "Yapı Yaklaşma Mesafeleri",
    description:
      "Ön/yan/arka bahçe çekme mesafeleri ile yola çekme mesafeleri."
  },
  {
    id: "kn-emsal",
    title: "Emsal & Kütle Hesabı",
    description: "TAKS, KAKS ve emsal harici alan tanımları."
  },
  {
    id: "kn-otopark",
    title: "Otopark Yönetmeliği",
    description:
      "Bağımsız bölüm başına ve ticari alan başına otopark yükümlülükleri."
  },
  {
    id: "kn-cati",
    title: "Çatı Eğimi ve Çatı Arası",
    description: "Çatı arası kullanımı, asma kat ve teras tanımları."
  },
  {
    id: "kn-koruma",
    title: "Koruma & Tescilli Yapı",
    description:
      "Sit alanları, tescilli parseller ve koruma amaçlı UİP koşulları."
  },
  {
    id: "kn-deprem",
    title: "Deprem & Riskli Yapı",
    description:
      "6306 sayılı Kanun kapsamı, riskli alan tespitleri ve dönüşüm hakları."
  }
];
