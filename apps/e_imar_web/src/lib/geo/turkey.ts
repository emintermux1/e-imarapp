export const TURKEY_CENTER: [number, number] = [35.2, 39.0];

export const TURKEY_BOUNDS = {
  west: 25.0,
  south: 34.5,
  east: 45.5,
  north: 43.5
} as const;

export const TURKEY_MAX_BOUNDS: [[number, number], [number, number]] = [
  [TURKEY_BOUNDS.west, TURKEY_BOUNDS.south],
  [TURKEY_BOUNDS.east, TURKEY_BOUNDS.north]
];

export const TURKEY_FIT_BOUNDS: [[number, number], [number, number]] = [
  [25.2, 35.5],
  [44.9, 42.3]
];

export const TURKEY_RASTER_BOUNDS: [number, number, number, number] = [
  TURKEY_BOUNDS.west,
  TURKEY_BOUNDS.south,
  TURKEY_BOUNDS.east,
  TURKEY_BOUNDS.north
];

export const TURKEY_FRAME_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Türkiye çalışma alanı" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [TURKEY_BOUNDS.west, TURKEY_BOUNDS.south],
            [TURKEY_BOUNDS.east, TURKEY_BOUNDS.south],
            [TURKEY_BOUNDS.east, TURKEY_BOUNDS.north],
            [TURKEY_BOUNDS.west, TURKEY_BOUNDS.north],
            [TURKEY_BOUNDS.west, TURKEY_BOUNDS.south]
          ]
        ]
      }
    }
  ]
} as const;

export function inTurkey(lng: number, lat: number) {
  return (
    lng >= TURKEY_BOUNDS.west &&
    lng <= TURKEY_BOUNDS.east &&
    lat >= TURKEY_BOUNDS.south &&
    lat <= TURKEY_BOUNDS.north
  );
}
