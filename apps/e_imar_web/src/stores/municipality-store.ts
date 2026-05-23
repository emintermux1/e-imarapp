"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface MunicipalityState {
  selectedMunicipalityId: string | null;
  selectedMunicipalityName: string | null;
  selectedSourceId: string | null;
  setSelectedMunicipality: (input: {
    municipalityId: string | null;
    municipalityName?: string | null;
    sourceId?: string | null;
  }) => void;
  clearSelectedMunicipality: () => void;
}

export const useMunicipalityStore = create<MunicipalityState>()(
  persist(
    (set) => ({
      selectedMunicipalityId: null,
      selectedMunicipalityName: null,
      selectedSourceId: null,
      setSelectedMunicipality: ({
        municipalityId,
        municipalityName = null,
        sourceId = null
      }) =>
        set({
          selectedMunicipalityId: municipalityId,
          selectedMunicipalityName: municipalityName,
          selectedSourceId: sourceId
        }),
      clearSelectedMunicipality: () =>
        set({
          selectedMunicipalityId: null,
          selectedMunicipalityName: null,
          selectedSourceId: null
        })
    }),
    {
      name: "eimar:municipality",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
