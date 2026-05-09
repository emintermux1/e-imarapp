export type GeoJsonLike =
  | GeoJSON.Geometry
  | GeoJSON.Feature
  | GeoJSON.FeatureCollection
  | Record<string, unknown>
  | null
  | undefined;

function collectCoordinates(input: unknown, out: Array<[number, number]>) {
  if (!Array.isArray(input)) return;
  if (input.length >= 2 && typeof input[0] === "number" && typeof input[1] === "number") {
    out.push([input[0], input[1]]);
    return;
  }
  input.forEach((item) => collectCoordinates(item, out));
}

export function extractGeoJsonGeometry(input: GeoJsonLike): GeoJSON.Geometry | null {
  if (!input || typeof input !== "object") return null;
  const feature = input as GeoJSON.Feature;
  if (feature.type === "Feature") {
    if (!feature.geometry) return null;
    return extractGeoJsonGeometry(feature.geometry as GeoJsonLike);
  }
  const collection = input as GeoJSON.FeatureCollection;
  if (collection.type === "FeatureCollection") {
    for (const featureItem of collection.features ?? []) {
      const geometry = extractGeoJsonGeometry(featureItem as GeoJsonLike);
      if (geometry) return geometry;
    }
    return null;
  }
  const geometry = input as GeoJSON.Geometry;
  if (typeof geometry.type === "string" && "coordinates" in geometry) {
    return geometry;
  }
  return null;
}

export function toFeatureCollection(input: GeoJsonLike): GeoJSON.FeatureCollection {
  if (!input || typeof input !== "object") {
    return { type: "FeatureCollection", features: [] };
  }
  const feature = input as GeoJSON.Feature;
  if (feature.type === "Feature") {
    return feature.geometry
      ? { type: "FeatureCollection", features: [feature] }
      : { type: "FeatureCollection", features: [] };
  }
  const collection = input as GeoJSON.FeatureCollection;
  if (collection.type === "FeatureCollection") {
    return {
      type: "FeatureCollection",
      features: (collection.features ?? []).filter(
        (item): item is GeoJSON.Feature => Boolean(item?.geometry)
      )
    };
  }
  const geometry = extractGeoJsonGeometry(input);
  return geometry
    ? {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry }]
      }
    : { type: "FeatureCollection", features: [] };
}

export function geoJsonCentroid(input: GeoJsonLike): [number, number] | undefined {
  const geometry = extractGeoJsonGeometry(input);
  if (!geometry) return undefined;
  const coords: Array<[number, number]> = [];
  collectCoordinates((geometry as { coordinates?: unknown }).coordinates, coords);
  if (coords.length === 0) return undefined;
  const [lng, lat] = coords.reduce(
    ([accLng, accLat], [x, y]) => [accLng + x, accLat + y],
    [0, 0]
  );
  return [lng / coords.length, lat / coords.length];
}

export function geoJsonBounds(input: GeoJsonLike): [[number, number], [number, number]] | null {
  const geometry = extractGeoJsonGeometry(input);
  if (!geometry) return null;
  const coords: Array<[number, number]> = [];
  collectCoordinates((geometry as { coordinates?: unknown }).coordinates, coords);
  if (coords.length === 0) return null;
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}
