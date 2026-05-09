"use client";

import type { ParcelFeature } from "@/types/parcel";
import type { FlyTarget } from "@/stores/map-store";

/**
 * Compute optimal flyTo parameters for a parcel based on its geometry.
 * Prefers bounds-based fitting for more natural focus, falls back to centroid
 * zoom for simple cases.
 */
export function computeParcelFlyTarget(parcel: ParcelFeature): FlyTarget | null {
  const { centroid } = parcel.properties;
  const geometry = parcel.geometry;

  if (!centroid) return null;

  // Compute bounds from polygon ring
  const ring = geometry.coordinates[0] ?? [];
  if (ring.length === 0) {
    // Fallback to centroid with default zoom
    return {
      center: centroid,
      zoom: 16,
      seq: 0
    };
  }

  const bbox = ring.reduce(
    (acc, [lng, lat]) => ({
      west: Math.min(acc.west, lng),
      south: Math.min(acc.south, lat),
      east: Math.max(acc.east, lng),
      north: Math.max(acc.north, lat)
    }),
    {
      west: Number.POSITIVE_INFINITY,
      south: Number.POSITIVE_INFINITY,
      east: Number.NEGATIVE_INFINITY,
      north: Number.NEGATIVE_INFINITY
    }
  );

  const hasBbox = Number.isFinite(bbox.west);

  if (!hasBbox) {
    // Invalid bounds, fallback
    return {
      center: centroid,
      zoom: 16,
      seq: 0
    };
  }

  // Return target with bounds for fitBounds behavior
  return {
    center: centroid,
    bounds: bbox,
    zoom: 16.2,
    parcelId: parcel.properties.id,
    seq: 0
  };
}

/**
 * Helper to handle parcel selection consistently across the app.
 * Used by search, map clicks, and other parcel-opening flows.
 */
export interface ParcelSelectionOptions {
  openRightPanel?: boolean;
  triggerFlyTo?: boolean;
}

export function buildParcelSelectionActions(
  parcel: ParcelFeature,
  opts: ParcelSelectionOptions = {}
) {
  const {
    openRightPanel = true,
    triggerFlyTo = true
  } = opts;

  const actions = {
    selectedParcelId: parcel.properties.id,
    rightPanelOpen: openRightPanel,
    flyTarget: triggerFlyTo ? computeParcelFlyTarget(parcel) : null
  };

  return actions;
}
