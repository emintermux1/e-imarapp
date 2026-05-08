'use client';

import { create } from 'zustand';

interface TimemachineState {
  fromAt: string | null; // ISO timestamp of the "before" snapshot
  toAt: string | null; // ISO timestamp of the "after" snapshot
  comparePosition: number; // 0..1, used by the swipe compare slider
  playing: boolean;
  setRange: (from: string | null, to: string | null) => void;
  setFromAt: (value: string | null) => void;
  setToAt: (value: string | null) => void;
  setComparePosition: (p: number) => void;
  togglePlay: () => void;
  reset: () => void;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export const useTimemachineStore = create<TimemachineState>((set) => ({
  fromAt: null,
  toAt: null,
  comparePosition: 0.5,
  playing: false,
  setRange: (from, to) => set({ fromAt: from, toAt: to }),
  setFromAt: (value) => set({ fromAt: value }),
  setToAt: (value) => set({ toAt: value }),
  setComparePosition: (p) => set({ comparePosition: clamp01(p) }),
  togglePlay: () => set((state) => ({ playing: !state.playing })),
  reset: () =>
    set({ fromAt: null, toAt: null, comparePosition: 0.5, playing: false }),
}));
