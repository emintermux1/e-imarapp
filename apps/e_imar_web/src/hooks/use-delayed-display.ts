"use client";

import * as React from "react";

interface Options {
  /** When true, the value flips to true. */
  enabled: boolean;
  /** Wait this many ms before flipping to true. Default 200. */
  delayMs?: number;
}

/**
 * Returns `true` only after `enabled` has been true for `delayMs`. If
 * `enabled` flips back to false at any time, the timer cancels and we return
 * to false immediately. Used to avoid skeleton flicker on quick loads.
 */
export function useDelayedDisplay({ enabled, delayMs = 200 }: Options) {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setShown(false);
      return;
    }
    const t = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(t);
  }, [enabled, delayMs]);

  return shown;
}
