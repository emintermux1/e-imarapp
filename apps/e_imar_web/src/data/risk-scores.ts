/**
 * Risk skorları zaten parsel özelliklerine gömülüdür. Bu dosya, tablonun
 * UI tarafında konsolide kullanımı için seviye etiketlerini ve renk
 * referanslarını sağlar.
 */
export const DEPREM_LABELS: Record<number, string> = {
  1: "Çok Düşük",
  2: "Düşük",
  3: "Orta",
  4: "Yüksek",
  5: "Çok Yüksek"
};

export const RISK03_LABELS: Record<number, string> = {
  0: "Yok",
  1: "Düşük",
  2: "Orta",
  3: "Yüksek"
};

export interface RiskBadgeColor {
  bg: string;
  fg: string;
}

export const RISK_COLOR_TOKENS: Record<number, string> = {
  0: "var(--risk-0)",
  1: "var(--risk-1)",
  2: "var(--risk-2)",
  3: "var(--risk-3)",
  4: "var(--risk-4)",
  5: "var(--risk-5)"
};
