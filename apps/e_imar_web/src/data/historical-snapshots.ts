import type { ZoningType } from "@/types/parcel";

/**
 * Time Machine için parsel başına yıl bazlı durum görünüm anlık verileri.
 *
 * Her parselin gerçek API entegrasyonunda farklı yıllarda farklı plan
 * notları, askı sürecinde olabilmesi mümkündür; mock veride sınırlı bir
 * snapshot kümesi tutuyoruz. Bilinmeyen yıllar için en yakın geçmiş
 * snapshot'a düşeriz, hiç yoksa parselin günümüz hali kullanılır.
 */
export interface ParcelHistoricalSnapshot {
  yil: number;
  zoningType?: ZoningType;
  taks?: number;
  kaks?: number;
  gabariM?: number;
  katSiniri?: number;
  planAdi?: string;
  planNotlari?: string[];
  askiDurum?: "askida" | "onaylandi" | "reddedildi" | "yok";
  /** 1 satırlık değişiklik özeti */
  ozet?: string;
}

export interface PlanChangeEntry {
  /** ISO date for the change */
  tarih: string;
  yil: number;
  baslik: string;
  /** Human-summary diff text */
  ozet: string;
  /** Field-level diffs */
  delta: {
    label: string;
    onceki: string;
    sonraki: string;
    yon: "increase" | "decrease" | "neutral";
  }[];
  /** Tag for the kind of change */
  kategori: "Revizyon" | "Tadilat" | "İlk Plan" | "İptal" | "Onay";
}

const yearsAvailable = [2010, 2014, 2017, 2020, 2022, 2024] as const;

export const HISTORICAL_YEAR_RANGE = { min: 2010, max: 2024 } as const;

/**
 * Mock snapshots — only a subset of parcels have explicit history. Others
 * fall through to "current" data when looked up.
 *
 * Strategy: we provide a few realistic stories
 *   - Beşiktaş Levent (TR-34-BES-1234-2): yeşil → konut → karma (2014→2024)
 *   - Konak Alsancak (TR-35-KON-7102-x): konut → ticaret upzoning
 *   - Çankaya Çukurambar: tarım → konut (2010), revize 2017
 *   - Nilüfer Görükle: sanayi → karma (2020)
 *   - Muratpaşa Lara: turizm gabari artışı 2022 (sonra reddedildi 2024)
 * Other parcels use a synthesized snapshot per year (see `synthSnapshot`).
 */
const HISTORY: Record<string, ParcelHistoricalSnapshot[]> = {
  "TR-34-BES-1234-2": [
    {
      yil: 2010,
      zoningType: "Yesil",
      kaks: 0.05,
      taks: 0.04,
      gabariM: 4.5,
      katSiniri: 1,
      planAdi: "Mevzii imar planı",
      askiDurum: "yok",
      ozet: "Yeşil alan koruması ile başlangıç planı."
    },
    {
      yil: 2017,
      zoningType: "Yesil",
      kaks: 0.11,
      taks: 0.04,
      gabariM: 4.8,
      katSiniri: 1,
      planAdi: "1/1000 ölçekli UİP revizyonu",
      askiDurum: "onaylandi",
      ozet: "Bahçe çekme mesafeleri yeniden düzenlendi."
    },
    {
      yil: 2022,
      zoningType: "Yesil",
      kaks: 0.11,
      taks: 0.04,
      gabariM: 4.8,
      katSiniri: 1,
      planAdi: "1/1000 ölçekli UİP",
      askiDurum: "yok",
      ozet: "Mevcut emsal/gabari korundu."
    },
    {
      yil: 2024,
      askiDurum: "askida",
      ozet: "İtiraz süresi devam ediyor."
    }
  ],
  "TR-35-KON-7102-1": [
    {
      yil: 2014,
      zoningType: "Konut",
      kaks: 1.6,
      taks: 0.35,
      gabariM: 18,
      katSiniri: 6,
      planAdi: "1/1000 İmar Planı",
      ozet: "Bölgede konut yoğunluğu egemen."
    },
    {
      yil: 2017,
      zoningType: "Konut",
      kaks: 2.0,
      taks: 0.4,
      gabariM: 21,
      katSiniri: 7,
      planAdi: "1/1000 Plan Revizyonu",
      ozet: "Karma kullanım için altyapı hazırlığı."
    },
    {
      yil: 2020,
      zoningType: "Karma",
      kaks: 2.5,
      taks: 0.45,
      gabariM: 27,
      katSiniri: 9,
      planAdi: "Karma Kullanım Plan Tadilatı",
      askiDurum: "onaylandi",
      ozet: "Konut + ticaret karma alana dönüştürüldü."
    },
    {
      yil: 2024,
      zoningType: "Karma",
      kaks: 2.8,
      taks: 0.45,
      gabariM: 30,
      katSiniri: 10,
      planAdi: "Mevcut Karma UİP",
      ozet: "Gabari +9 m, emsal +0.30 yükseldi."
    }
  ],
  "TR-06-CAN-2104-3": [
    {
      yil: 2010,
      zoningType: "Tarim",
      kaks: 0.1,
      taks: 0.1,
      gabariM: 6,
      katSiniri: 2,
      planAdi: "Tarımsal arazi · planlama dışı",
      ozet: "Çevre yolu inşaatı öncesi tarımsal kullanım."
    },
    {
      yil: 2014,
      zoningType: "Konut",
      kaks: 1.0,
      taks: 0.3,
      gabariM: 12,
      katSiniri: 4,
      planAdi: "1/1000 ölçekli İmar Planı",
      askiDurum: "onaylandi",
      ozet: "Tarım → konut alanı dönüşümü onaylandı."
    },
    {
      yil: 2017,
      zoningType: "Konut",
      kaks: 1.6,
      taks: 0.35,
      gabariM: 18,
      katSiniri: 6,
      planAdi: "Plan Revizyonu",
      ozet: "Yoğunluk artışı: emsal +0.6, kat +2."
    },
    {
      yil: 2020,
      zoningType: "Konut",
      kaks: 2.2,
      taks: 0.4,
      gabariM: 24,
      katSiniri: 8,
      planAdi: "Yoğunluk Tadilatı",
      askiDurum: "onaylandi",
      ozet: "Bölge metrosu hattına bağlı upzoning."
    },
    {
      yil: 2024,
      ozet: "Mevcut plan aynen yürürlükte."
    }
  ],
  "TR-16-NIL-1308-1": [
    {
      yil: 2014,
      zoningType: "Sanayi",
      kaks: 1.0,
      taks: 0.5,
      gabariM: 12,
      katSiniri: 4,
      planAdi: "Sanayi alanı UİP",
      ozet: "OSB yakını sanayi parselleri."
    },
    {
      yil: 2020,
      zoningType: "Karma",
      kaks: 1.6,
      taks: 0.4,
      gabariM: 18,
      katSiniri: 6,
      planAdi: "Karma kullanım UİP tadilatı",
      askiDurum: "onaylandi",
      ozet: "Sanayi → karma kullanıma çevrildi."
    },
    {
      yil: 2024,
      ozet: "Karma alan halen yürürlükte."
    }
  ],
  "TR-07-MUR-4502-1": [
    {
      yil: 2014,
      zoningType: "Turizm",
      kaks: 1.4,
      taks: 0.3,
      gabariM: 16,
      katSiniri: 5,
      planAdi: "1/1000 ölçekli Turizm Alanı UİP",
      ozet: "Sahil bandı turizm alanı."
    },
    {
      yil: 2022,
      zoningType: "Turizm",
      kaks: 2.0,
      taks: 0.35,
      gabariM: 24,
      katSiniri: 8,
      planAdi: "Gabari Artışı Tadilatı",
      askiDurum: "askida",
      ozet: "Tadilat askıdayken bölge sakinleri itiraz etti."
    },
    {
      yil: 2024,
      zoningType: "Turizm",
      kaks: 1.4,
      taks: 0.3,
      gabariM: 16,
      katSiniri: 5,
      planAdi: "1/1000 ölçekli Turizm Alanı UİP",
      askiDurum: "reddedildi",
      ozet: "Tadilat reddedildi, plan eski haline döndü."
    }
  ]
};

/**
 * Mock plan değişikliği kayıtları — RightInfoPanel SectionGecmis bunları
 * kullanır.
 */
const PLAN_CHANGES: Record<string, PlanChangeEntry[]> = {
  "TR-34-BES-1234-2": [
    {
      tarih: "2017-06-12",
      yil: 2017,
      baslik: "1/1000 UİP Revizyonu",
      kategori: "Revizyon",
      ozet: "Bahçe mesafeleri ve gabari toleransı yeniden düzenlendi.",
      delta: [
        { label: "Emsal", onceki: "0.05", sonraki: "0.11", yon: "increase" },
        { label: "Gabari", onceki: "4.5 m", sonraki: "4.8 m", yon: "increase" }
      ]
    },
    {
      tarih: "2022-12-28",
      yil: 2022,
      baslik: "Plan Onay Yenilemesi",
      kategori: "Onay",
      ozet: "Mevcut yapılaşma şartları aynen yürürlüğe alındı.",
      delta: [
        { label: "TAKS", onceki: "0.04", sonraki: "0.04", yon: "neutral" },
        { label: "KAKS", onceki: "0.11", sonraki: "0.11", yon: "neutral" }
      ]
    },
    {
      tarih: "2026-04-15",
      yil: 2026,
      baslik: "Tadilat Askıya Alındı",
      kategori: "Tadilat",
      ozet: "İtiraz süresi 14 Haziran 2026'ya kadar.",
      delta: [
        { label: "Plan", onceki: "—", sonraki: "Beşiktaş Revizyon UİP", yon: "neutral" }
      ]
    }
  ],
  "TR-35-KON-7102-1": [
    {
      tarih: "2017-09-21",
      yil: 2017,
      baslik: "Yoğunluk Hazırlık Revizyonu",
      kategori: "Revizyon",
      ozet: "Karma kullanım altyapısı için emsal artırıldı.",
      delta: [
        { label: "Emsal", onceki: "1.60", sonraki: "2.00", yon: "increase" },
        { label: "TAKS", onceki: "0.35", sonraki: "0.40", yon: "increase" },
        { label: "Gabari", onceki: "18 m", sonraki: "21 m", yon: "increase" }
      ]
    },
    {
      tarih: "2020-03-04",
      yil: 2020,
      baslik: "Karma Kullanım Tadilatı",
      kategori: "Tadilat",
      ozet: "Konut → karma alana dönüştürüldü.",
      delta: [
        { label: "Plan Tipi", onceki: "Konut", sonraki: "Karma", yon: "neutral" },
        { label: "Emsal", onceki: "2.00", sonraki: "2.50", yon: "increase" },
        { label: "Kat", onceki: "7", sonraki: "9", yon: "increase" }
      ]
    },
    {
      tarih: "2024-01-18",
      yil: 2024,
      baslik: "Gabari Artış Onayı",
      kategori: "Onay",
      ozet: "Gabari +3 m, emsal +0.3 yükseldi.",
      delta: [
        { label: "Gabari", onceki: "27 m", sonraki: "30 m", yon: "increase" },
        { label: "Emsal", onceki: "2.50", sonraki: "2.80", yon: "increase" }
      ]
    }
  ],
  "TR-06-CAN-2104-3": [
    {
      tarih: "2014-05-08",
      yil: 2014,
      baslik: "Tarım → Konut Alanı Dönüşümü",
      kategori: "İlk Plan",
      ozet: "Çevre yolu hattıyla birlikte konut alanına çevrildi.",
      delta: [
        { label: "Plan Tipi", onceki: "Tarım", sonraki: "Konut", yon: "neutral" },
        { label: "Emsal", onceki: "0.10", sonraki: "1.00", yon: "increase" }
      ]
    },
    {
      tarih: "2017-11-16",
      yil: 2017,
      baslik: "Yoğunluk Revizyonu",
      kategori: "Revizyon",
      ozet: "Plan kademesinde emsal yükseldi.",
      delta: [
        { label: "Emsal", onceki: "1.00", sonraki: "1.60", yon: "increase" },
        { label: "Kat", onceki: "4", sonraki: "6", yon: "increase" }
      ]
    },
    {
      tarih: "2020-08-03",
      yil: 2020,
      baslik: "Metro Bağlantısı Tadilatı",
      kategori: "Tadilat",
      ozet: "Yeni metro hattıyla bölgede upzoning yapıldı.",
      delta: [
        { label: "Emsal", onceki: "1.60", sonraki: "2.20", yon: "increase" },
        { label: "Gabari", onceki: "18 m", sonraki: "24 m", yon: "increase" },
        { label: "Kat", onceki: "6", sonraki: "8", yon: "increase" }
      ]
    }
  ],
  "TR-16-NIL-1308-1": [
    {
      tarih: "2020-09-12",
      yil: 2020,
      baslik: "Sanayi → Karma Tadilatı",
      kategori: "Tadilat",
      ozet: "OSB sınırı dışında karma alana dönüştürüldü.",
      delta: [
        { label: "Plan Tipi", onceki: "Sanayi", sonraki: "Karma", yon: "neutral" },
        { label: "Emsal", onceki: "1.00", sonraki: "1.60", yon: "increase" },
        { label: "Kat", onceki: "4", sonraki: "6", yon: "increase" }
      ]
    },
    {
      tarih: "2025-09-12",
      yil: 2025,
      baslik: "Plan Onayı",
      kategori: "Onay",
      ozet: "Karma kullanım onayı askıdan resmi yürürlüğe alındı.",
      delta: [
        { label: "Plan", onceki: "Askıda", sonraki: "Onaylı", yon: "neutral" }
      ]
    }
  ],
  "TR-07-MUR-4502-1": [
    {
      tarih: "2014-04-22",
      yil: 2014,
      baslik: "Turizm Alanı UİP",
      kategori: "İlk Plan",
      ozet: "Sahil bandı turizm alanı tanımlandı.",
      delta: [
        { label: "Plan Tipi", onceki: "—", sonraki: "Turizm", yon: "neutral" },
        { label: "Emsal", onceki: "—", sonraki: "1.40", yon: "neutral" }
      ]
    },
    {
      tarih: "2022-11-18",
      yil: 2022,
      baslik: "Gabari Artışı Tadilatı (Askıda)",
      kategori: "Tadilat",
      ozet: "İtirazlar nedeniyle değerlendirme uzatıldı.",
      delta: [
        { label: "Emsal", onceki: "1.40", sonraki: "2.00", yon: "increase" },
        { label: "Gabari", onceki: "16 m", sonraki: "24 m", yon: "increase" }
      ]
    },
    {
      tarih: "2025-01-11",
      yil: 2025,
      baslik: "Tadilat Reddi",
      kategori: "İptal",
      ozet: "Bölge sakini itirazları kabul edildi, plan iptal.",
      delta: [
        { label: "Emsal", onceki: "2.00", sonraki: "1.40", yon: "decrease" },
        { label: "Gabari", onceki: "24 m", sonraki: "16 m", yon: "decrease" }
      ]
    }
  ]
};

/** Geri dönen `null`, "geçmiş yok, mevcut hali kullan" demektir. */
export function getSnapshotForYear(
  parcelId: string,
  year: number
): ParcelHistoricalSnapshot | null {
  const list = HISTORY[parcelId];
  if (list && list.length > 0) {
    // Find latest entry whose year <= requested
    const sorted = [...list].sort((a, b) => a.yil - b.yil);
    let chosen: ParcelHistoricalSnapshot | null = null;
    for (const s of sorted) {
      if (s.yil <= year) chosen = s;
      else break;
    }
    return chosen;
  }
  // No explicit history: synthesize a snapshot for early years.
  return synthSnapshot(year);
}

function synthSnapshot(year: number): ParcelHistoricalSnapshot | null {
  if (year >= 2022) return null; // current
  // Pre-2014 implies older plan with smaller envelope; pre-2010 is "no plan".
  if (year < 2014) {
    return {
      yil: year,
      ozet: "Eski plan dönemi: yapılaşma katsayıları daha düşük.",
      kaks: undefined,
      taks: undefined
    };
  }
  return {
    yil: year,
    ozet: "Bu yıl için kayıtlı plan değişikliği bulunmuyor."
  };
}

export function getPlanChanges(parcelId: string): PlanChangeEntry[] {
  const list = PLAN_CHANGES[parcelId];
  if (list && list.length > 0) return list;
  return DEFAULT_PLAN_CHANGES;
}

const DEFAULT_PLAN_CHANGES: PlanChangeEntry[] = [
  {
    tarih: "2017-08-15",
    yil: 2017,
    baslik: "1/1000 UİP Revizyonu",
    kategori: "Revizyon",
    ozet: "Plan notlarında bahçe çekme ve emsal düzenlemesi yapıldı.",
    delta: [
      { label: "Emsal", onceki: "1.50", sonraki: "1.80", yon: "increase" },
      { label: "Gabari", onceki: "15.5 m", sonraki: "18 m", yon: "increase" }
    ]
  },
  {
    tarih: "2020-04-21",
    yil: 2020,
    baslik: "Plan Tadilatı",
    kategori: "Tadilat",
    ozet: "Yapılaşma yoğunluğu yeniden değerlendirildi.",
    delta: [
      { label: "TAKS", onceki: "0.35", sonraki: "0.40", yon: "increase" },
      { label: "Kat", onceki: "5", sonraki: "6", yon: "increase" }
    ]
  },
  {
    tarih: "2022-09-10",
    yil: 2022,
    baslik: "Plan Onay Yenilemesi",
    kategori: "Onay",
    ozet: "Mevcut yapılaşma koşulları korundu.",
    delta: [
      { label: "Plan", onceki: "—", sonraki: "Yenileme", yon: "neutral" }
    ]
  }
];

export const TIME_MACHINE_YEARS = yearsAvailable;
