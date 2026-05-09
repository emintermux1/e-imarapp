"use client";

import * as React from "react";
import type { ParcelProps } from "@/types/parcel";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";

export type SemanticRiskFocus = "deprem" | "heyelan" | "sel" | "yangin" | null;
export type SemanticSourceKind = "note" | "constraint" | "risk";
export type SemanticFocusKind = "risk" | "constraint" | "note" | "aski";

export interface SemanticParcelAction {
  kind: SemanticFocusKind;
  focusKey: string;
  label: string;
  status: string;
  riskFocus: SemanticRiskFocus;
  layerVisibility: Partial<Record<string, boolean>>;
  askiMode?: boolean;
}

export function normalizeSemanticText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

export function resolveSemanticParcelAction(
  value: string,
  sourceKind: SemanticSourceKind
): SemanticParcelAction | null {
  const text = normalizeSemanticText(value);

  if (includesAny(text, ["deprem", "sismik", "afad"]) || (sourceKind !== "risk" && text.includes("jeolojik"))) {
    return {
      kind: "risk",
      focusKey: "risk:deprem",
      label: "Deprem odağı",
      status: "AFAD / jeolojik risk katmanı",
      riskFocus: "deprem",
      layerVisibility: { "deprem-risk-grid": true }
    };
  }

  if (includesAny(text, ["heyelan", "zemin kaymas", "kayma"])) {
    return {
      kind: "risk",
      focusKey: "risk:heyelan",
      label: "Heyelan odağı",
      status: "MTA heyelan katmanı",
      riskFocus: "heyelan",
      layerVisibility: { "deprem-risk-grid": true }
    };
  }

  if (includesAny(text, ["sel", "taskin", "taşkın", "dsi", "dere", "su baskini"])) {
    return {
      kind: "risk",
      focusKey: "risk:sel",
      label: "Sel / taşkın odağı",
      status: "DSİ ve su etkisi vurgusu",
      riskFocus: "sel",
      layerVisibility: { "deprem-risk-grid": true, "plan-constraint-line": true }
    };
  }

  if (includesAny(text, ["yangin", "orman"])) {
    return {
      kind: "risk",
      focusKey: "risk:yangin",
      label: "Yangın odağı",
      status: "Orman yangını riski",
      riskFocus: "yangin",
      layerVisibility: { "deprem-risk-grid": true }
    };
  }

  if (includesAny(text, ["aski", "askida", "revizyon"])) {
    return {
      kind: "aski",
      focusKey: "aski",
      label: "Askı katmanı",
      status: "Askı / revizyon görünümü",
      riskFocus: null,
      layerVisibility: { "askida-overlay": true },
      askiMode: true
    };
  }

  if (includesAny(text, ["sit", "koruma", "kıyı", "kiyi", "kiyi kenar cizgisi"])) {
    return {
      kind: "constraint",
      focusKey: "constraint:koruma",
      label: "Koruma odağı",
      status: "Sit / koruma sınırları",
      riskFocus: null,
      layerVisibility: { "plan-constraint-line": true }
    };
  }

  if (includesAny(text, ["cekme mesafesi", "çekme mesafesi", "tevhid", "ifraz", "otopark", "mania", "dsi", "dere"])) {
    return {
      kind: "note",
      focusKey: `note:${text.slice(0, 24)}`,
      label: "Plan notu odağı",
      status: "Plan notu vurgusu",
      riskFocus: null,
      layerVisibility: {}
    };
  }

  return null;
}

export interface SemanticFocusDescriptor {
  key: string;
  label: string;
  status: string;
}

export function describeSemanticFocus(state: {
  activeConstraintFilter: string | null;
  activePlanNoteFilter: string | null;
  activeRiskFocus: SemanticRiskFocus;
}): SemanticFocusDescriptor | null {
  if (state.activeRiskFocus) {
    switch (state.activeRiskFocus) {
      case "deprem":
        return { key: "risk:deprem", label: "Deprem odağı", status: "AFAD / jeolojik risk katmanı" };
      case "heyelan":
        return { key: "risk:heyelan", label: "Heyelan odağı", status: "MTA heyelan katmanı" };
      case "sel":
        return { key: "risk:sel", label: "Sel / taşkın odağı", status: "DSİ ve su etkisi vurgusu" };
      case "yangin":
        return { key: "risk:yangin", label: "Yangın odağı", status: "Orman yangını riski" };
    }
  }

  if (state.activeConstraintFilter) {
    return {
      key: `constraint:${normalizeSemanticText(state.activeConstraintFilter).slice(0, 24)}`,
      label: "Koruma odağı",
      status: state.activeConstraintFilter
    };
  }

  if (state.activePlanNoteFilter) {
    return {
      key: `note:${normalizeSemanticText(state.activePlanNoteFilter).slice(0, 24)}`,
      label: "Plan notu odağı",
      status: state.activePlanNoteFilter
    };
  }

  return null;
}

export function useSemanticParcelAction(parcel: ParcelProps) {
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const setLayerVisibility = useUIStore((s) => s.setLayerVisibility);
  const setAskiMode = useUIStore((s) => s.setAskiMode);
  const clearSemanticFocus = useUIStore((s) => s.clearSemanticFocus);
  const setActiveConstraintFilter = useUIStore((s) => s.setActiveConstraintFilter);
  const setActivePlanNoteFilter = useUIStore((s) => s.setActivePlanNoteFilter);
  const setActiveRiskFocus = useUIStore((s) => s.setActiveRiskFocus);

  return React.useCallback(
    (value: string, sourceKind: SemanticSourceKind) => {
      const action = resolveSemanticParcelAction(value, sourceKind);
      if (!action) return null;

      clearSemanticFocus();
      setSelectedParcelId(parcel.id);
      setRightPanelOpen(true);
      setActiveConstraintFilter(action.kind === "constraint" ? value : null);
      setActivePlanNoteFilter(action.kind === "note" || action.kind === "aski" ? value : null);
      setActiveRiskFocus(action.riskFocus);

      if (action.askiMode) {
        setAskiMode(true);
      }

      Object.entries(action.layerVisibility).forEach(([layerId, visible]) => {
        setLayerVisibility(layerId, Boolean(visible));
      });

      if (parcel.centroid) {
        flyTo({
          center: parcel.centroid,
          zoom: action.kind === "risk" ? 15.7 : 16.1,
          parcelId: parcel.id
        });
      }

      return action;
    },
    [
      flyTo,
      parcel.centroid,
      parcel.id,
      setActiveConstraintFilter,
      setActivePlanNoteFilter,
      setActiveRiskFocus,
      setAskiMode,
      clearSemanticFocus,
      setLayerVisibility,
      setRightPanelOpen,
      setSelectedParcelId
    ]
  );
}
