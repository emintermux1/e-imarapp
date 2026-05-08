export interface InvestmentSubScore {
  key: "konum" | "imar" | "likidite" | "risk";
  label: string;
  weight: number; // 0..1
}

export const INVESTMENT_SUBSCORES: InvestmentSubScore[] = [
  { key: "konum", label: "Konum", weight: 0.35 },
  { key: "imar", label: "İmar Verimi", weight: 0.3 },
  { key: "likidite", label: "Likidite", weight: 0.2 },
  { key: "risk", label: "Risk", weight: 0.15 }
];

/**
 * Parsel yatırım skoru bileşenlerinin türetilmesi.
 * Genel skor zaten parselde var; alt skorlar bu fonksiyonla deterministik
 * olarak parsel verisinden üretilir (mock).
 */
import type { ParcelProps } from "@/types/parcel";

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function deriveInvestmentBreakdown(p: ParcelProps) {
  const cevre = p.cevre;
  const konum = clamp(
    cevre.ulasimSkoru * 0.5 +
      (1 - Math.min(cevre.metroM, 2000) / 2000) * 30 +
      (1 - Math.min(cevre.hastaneKm, 10) / 10) * 20
  );
  const imar = clamp(p.kaks * 22 + p.taks * 30 + Math.min(p.gabariM, 40));
  const likidite = clamp(p.yatirimSkoru * 0.6 + (cevre.ulasimSkoru * 0.4));
  const riskBase =
    100 -
    p.riskler.deprem * 12 -
    p.riskler.heyelan * 6 -
    p.riskler.sel * 5 -
    p.riskler.yangin * 4;
  const risk = clamp(riskBase);
  return { konum, imar, likidite, risk };
}
