/**
 * Çevre/eski adıyla ulaşım ve yaşam kalitesi metriklerinin etiketleri ve
 * ikon eşleşmeleri.
 */
import type { LucideIcon } from "lucide-react";
import { Train, Hospital, GraduationCap, Trees, Bus, Volume2 } from "lucide-react";

export interface CevreField {
  key:
    | "metroM"
    | "hastaneKm"
    | "okulKm"
    | "parkM"
    | "ulasimSkoru"
    | "gurultuSkoru";
  label: string;
  unit: "m" | "km" | "skor";
  icon: LucideIcon;
}

export const CEVRE_FIELDS: CevreField[] = [
  { key: "metroM", label: "Yakın Metro", unit: "m", icon: Train },
  { key: "hastaneKm", label: "En Yakın Hastane", unit: "km", icon: Hospital },
  { key: "okulKm", label: "En Yakın Okul", unit: "km", icon: GraduationCap },
  { key: "parkM", label: "En Yakın Park", unit: "m", icon: Trees },
  { key: "ulasimSkoru", label: "Ulaşım Skoru", unit: "skor", icon: Bus },
  { key: "gurultuSkoru", label: "Gürültü Skoru", unit: "skor", icon: Volume2 }
];
