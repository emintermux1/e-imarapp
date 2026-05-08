"use client";

import { create } from "zustand";
import { getBackendAskiPlans, humanizeApiError } from "@/lib/api/backend-client";
import type { PlanResponse } from "@/types/api";

interface AskiState {
  plans: PlanResponse[];
  status: "idle" | "loading" | "live" | "fallback" | "unavailable";
  message?: string;
  lastCheckedAt?: string;
  refresh: () => Promise<void>;
}

export const useAskiStore = create<AskiState>()((set) => ({
  plans: [],
  status: "idle",
  refresh: async () => {
    set({ status: "loading", message: "Canlı askı planları yenileniyor…" });
    try {
      const plans = await getBackendAskiPlans();
      const safePlans = Array.isArray(plans) ? plans : [];
      set({
        plans: safePlans,
        status: safePlans.length > 0 ? "live" : "fallback",
        message:
          safePlans.length > 0
            ? `${safePlans.length} canlı askı planı yüklendi`
            : "Canlı askı planı dönmedi — yerel/demo katman gösteriliyor",
        lastCheckedAt: new Date().toISOString()
      });
    } catch (error) {
      set({
        plans: [],
        status: "unavailable",
        message: `${humanizeApiError(error)} Yerel/demo askı katmanı korunuyor.`,
        lastCheckedAt: new Date().toISOString()
      });
    }
  }
}));
