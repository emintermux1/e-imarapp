"use client";

import type * as CesiumNS from "cesium";
import { ZONING_PRESETS } from "@/data/zoning";
import type { ParcelFeature, ParcelProps } from "@/types/parcel";
import type { ParcelHistoricalSnapshot } from "@/data/historical-snapshots";

/**
 * Compute extrusion height (m) for a parcel. Uses the historical snapshot if
 * provided (allows TimelinePanel to re-color/re-extrude historical state).
 *
 * Falls back to gabariM, then katSiniri × katYüksekliği=3.
 */
export function parcelExtrusionHeight(
  parcel: ParcelProps,
  snapshot?: ParcelHistoricalSnapshot | null
): number {
  const gabari = snapshot?.gabariM ?? parcel.gabariM;
  const kat = snapshot?.katSiniri ?? parcel.katSiniri ?? 4;
  if (Number.isFinite(gabari) && gabari > 0) return gabari;
  return Math.max(3, kat) * 3;
}

/** Resolve effective zoning for the given snapshot. */
export function effectiveZoning(
  parcel: ParcelProps,
  snapshot?: ParcelHistoricalSnapshot | null
) {
  return snapshot?.zoningType ?? parcel.zoningType;
}

interface ParcelEntityHandles {
  parcelId: string;
  baseEntity: CesiumNS.Entity;
  buildingEntity: CesiumNS.Entity;
  emsalEntity?: CesiumNS.Entity;
}

interface AddParcelOptions {
  selected: boolean;
  snapshot?: ParcelHistoricalSnapshot | null;
  /** When true, also draw a wireframe envelope of TAKS×alan × kat×3 m */
  emsalWireframe?: boolean;
}

/**
 * Build/refresh entities for a single parcel feature.
 */
export function upsertParcelEntities(
  Cesium: typeof import("cesium"),
  viewer: CesiumNS.Viewer,
  feature: ParcelFeature,
  existing: Map<string, ParcelEntityHandles>,
  opts: AddParcelOptions
): ParcelEntityHandles {
  const { Cartesian3, Color, ColorMaterialProperty, JulianDate } = Cesium;
  const props = feature.properties;
  const ring = feature.geometry.coordinates[0];
  const flat: number[] = [];
  for (const [lng, lat] of ring) {
    flat.push(lng, lat);
  }
  const positions = Cartesian3.fromDegreesArray(flat);

  const zoning = effectiveZoning(props, opts.snapshot);
  const preset =
    ZONING_PRESETS[zoning as keyof typeof ZONING_PRESETS] ?? ZONING_PRESETS.Konut;

  const fillColor = Color.fromCssColorString(preset.fill).withAlpha(
    opts.selected ? 0.85 : 0.62
  );
  const strokeColor = Color.fromCssColorString(preset.stroke).withAlpha(
    opts.selected ? 1 : 0.85
  );
  const accentColor = Color.fromCssColorString("#C8102E");

  const height = parcelExtrusionHeight(props, opts.snapshot);
  const liftedHeight = opts.selected ? height + 1.5 : height;

  // Reuse entities if we have them
  let h = existing.get(props.id);
  if (!h) {
    const baseEntity = viewer.entities.add({
      id: `${props.id}::base`,
      polygon: {
        hierarchy: positions,
        height: 0,
        material: fillColor,
        outline: false,
        // ensure we draw on the ellipsoid surface
        perPositionHeight: false
      }
    });
    const buildingEntity = viewer.entities.add({
      id: `${props.id}::bldg`,
      polygon: {
        hierarchy: positions,
        height: 0,
        extrudedHeight: liftedHeight,
        material: fillColor,
        outline: true,
        outlineColor: opts.selected ? accentColor : strokeColor,
        outlineWidth: opts.selected ? 3 : 1.5,
        closeTop: true,
        closeBottom: false
      },
      properties: {
        parcelId: props.id,
        ada: props.ada,
        parsel: props.parsel,
        zoningType: zoning,
        height: liftedHeight
      }
    });
    h = { parcelId: props.id, baseEntity, buildingEntity };
    existing.set(props.id, h);
  } else {
    if (h.buildingEntity.polygon) {
      h.buildingEntity.polygon.material = new ColorMaterialProperty(fillColor);
      h.buildingEntity.polygon.extrudedHeight =
        new Cesium.ConstantProperty(liftedHeight);
      h.buildingEntity.polygon.outlineColor = new Cesium.ConstantProperty(
        opts.selected ? accentColor : strokeColor
      );
      h.buildingEntity.polygon.outlineWidth = new Cesium.ConstantProperty(
        opts.selected ? 3 : 1.5
      );
    }
    if (h.baseEntity.polygon) {
      h.baseEntity.polygon.material = new ColorMaterialProperty(
        fillColor.withAlpha(0.32)
      );
    }
  }

  // Emsal wireframe: tasarım envelope = TAKS × alan as approximate footprint
  // square + kat × 3 height. We render it as a translucent extruded outline
  // box at parcel centroid only when selected & emsalWireframe.
  const wantWireframe = !!(opts.selected && opts.emsalWireframe);
  if (wantWireframe) {
    const centroid = props.centroid ?? approxCentroid(ring);
    const footprintM2 = props.yuzolcumuM2 * props.taks;
    const halfSide = Math.sqrt(Math.max(footprintM2, 1)) / 2;
    const targetH = Math.max(props.katSiniri ?? 4, 1) * 3;
    const wireRing = squareRingDeg(centroid, halfSide);
    const flatWire: number[] = [];
    for (const [lng, lat] of wireRing) flatWire.push(lng, lat);
    const wirePositions = Cartesian3.fromDegreesArray(flatWire);
    if (!h.emsalEntity) {
      h.emsalEntity = viewer.entities.add({
        id: `${props.id}::emsal`,
        polygon: {
          hierarchy: wirePositions,
          height: 0,
          extrudedHeight: targetH,
          material: Color.WHITE.withAlpha(0.04),
          outline: true,
          outlineColor: Color.fromCssColorString("#3B6EA5").withAlpha(0.92),
          outlineWidth: 1.5,
          fill: true
        }
      });
    } else if (h.emsalEntity.polygon) {
      h.emsalEntity.polygon.hierarchy = new Cesium.ConstantProperty(
        new Cesium.PolygonHierarchy(wirePositions)
      );
      h.emsalEntity.polygon.extrudedHeight = new Cesium.ConstantProperty(
        targetH
      );
    }
  } else if (h.emsalEntity) {
    viewer.entities.remove(h.emsalEntity);
    h.emsalEntity = undefined;
  }

  // Touch the clock so changes render immediately
  void JulianDate;
  return h;
}

function approxCentroid(ring: number[][]): [number, number] {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const [lng, lat] of ring) {
    sx += lng;
    sy += lat;
    n += 1;
  }
  if (n === 0) return [0, 0];
  return [sx / n, sy / n];
}

function squareRingDeg(
  center: [number, number],
  halfSideM: number
): [number, number][] {
  const [lng, lat] = center;
  // Approx conversion: 1° lat ≈ 111_000 m; lng scaled by cos(lat).
  const dLat = halfSideM / 111_000;
  const dLng = halfSideM / (111_000 * Math.cos((lat * Math.PI) / 180));
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat]
  ];
}

/**
 * Build a translucent "view corridor" — a rectangle extending from the parcel
 * centroid toward `azimuth` (degrees from north) for `lengthM` meters.
 * Visualizes a basic line-of-sight through neighboring extrusions.
 */
export function buildViewCorridor(
  Cesium: typeof import("cesium"),
  viewer: CesiumNS.Viewer,
  centroid: [number, number],
  azimuthDeg = 35,
  lengthM = 220,
  widthM = 40,
  heightM = 60
): CesiumNS.Entity {
  const { Cartesian3, Color } = Cesium;
  const [lng, lat] = centroid;
  const az = (azimuthDeg * Math.PI) / 180;
  const dx = Math.sin(az) * lengthM;
  const dy = Math.cos(az) * lengthM;
  // Width perpendicular
  const px = Math.cos(az) * (widthM / 2);
  const py = -Math.sin(az) * (widthM / 2);

  const dLat = (m: number) => m / 111_000;
  const dLng = (m: number) => m / (111_000 * Math.cos((lat * Math.PI) / 180));

  const ring: [number, number][] = [
    [lng + dLng(-px), lat + dLat(-py)],
    [lng + dLng(px), lat + dLat(py)],
    [lng + dLng(dx + px), lat + dLat(dy + py)],
    [lng + dLng(dx - px), lat + dLat(dy - py)],
    [lng + dLng(-px), lat + dLat(-py)]
  ];
  const positions = Cartesian3.fromDegreesArray(
    ring.flatMap(([a, b]) => [a, b])
  );
  return viewer.entities.add({
    id: `corridor::${centroid.join(",")}`,
    polygon: {
      hierarchy: positions,
      height: 4,
      extrudedHeight: heightM,
      material: Color.fromCssColorString("#C8102E").withAlpha(0.18),
      outline: true,
      outlineColor: Color.fromCssColorString("#C8102E").withAlpha(0.7),
      outlineWidth: 2
    }
  });
}

/**
 * Translates (year, month, hour) into a JulianDate at the parcel longitude
 * accounting for solar position rather than UTC. This keeps shadow analysis
 * intuitive: hour=12 means *local solar noon*, not UTC noon.
 */
export function buildJulianDateForLocalSun(
  Cesium: typeof import("cesium"),
  centroidLng: number,
  month: number,
  hour: number,
  year = 2026
): CesiumNS.JulianDate {
  // Approx tz offset at longitude (1h per 15°)
  const offsetH = centroidLng / 15;
  const utcHour = hour - offsetH;
  const date = new Date(Date.UTC(year, month - 1, 15, 0, 0, 0));
  date.setUTCHours(date.getUTCHours() + utcHour);
  return Cesium.JulianDate.fromDate(date);
}

/** Compute polygon bounding box (degrees) for camera flyTo. */
export function ringBounds(ring: number[][]) {
  let west = 180;
  let east = -180;
  let south = 90;
  let north = -90;
  for (const [lng, lat] of ring) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return { west, east, south, north };
}

export type { ParcelEntityHandles };
