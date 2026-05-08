"use client";

import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Returns true when the user has set `prefers-reduced-motion: reduce`. Updates
 * reactively on changes. SSR-safe (returns `false` on first render).
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

/**
 * Returns durations to use in animations. When reduced motion is on, all
 * durations collapse to 0. Use these for components that don't go through
 * framer's MotionConfig (e.g. CSS transitions).
 */
export function useMotionDurations() {
  const reduced = usePrefersReducedMotion();
  if (reduced) {
    return {
      panelIn: 0,
      panelOut: 0,
      sheetSpring: { stiffness: 999, damping: 999, mass: 1 },
      accordion: 0,
      hover: 0,
      modeSwitch: 0,
      searchDrop: 0
    } as const;
  }
  return {
    panelIn: 0.22,
    panelOut: 0.18,
    sheetSpring: { stiffness: 320, damping: 32, mass: 1 },
    accordion: 0.18,
    hover: 0.12,
    modeSwitch: 0.22,
    searchDrop: 0.12
  } as const;
}
