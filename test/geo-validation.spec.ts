import { ringSignedArea, validateAndRepairGeoJson } from "../frontend/lib/geo-validation";

describe("validateAndRepairGeoJson", () => {
  it("flags CRS mismatch when crs present", () => {
    const fc = {
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "EPSG:3857" } },
      features: []
    };
    const r = validateAndRepairGeoJson(fc);
    expect(r.issues.some((i) => i.code === "CRS_MISMATCH")).toBe(true);
  });

  it("warns when geometry is outside Turkey bounding box", () => {
    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { ada: "1", parsel: "1" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [2, 2],
                [3, 2],
                [3, 3],
                [2, 3],
                [2, 2]
              ]
            ]
          }
        }
      ]
    };
    const r = validateAndRepairGeoJson(fc);
    expect(r.issues.some((i) => i.code === "EXTENT_OUTSIDE_TR_BOX")).toBe(true);
  });

  it("reports incomplete ada/parsel metadata", () => {
    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [29, 41],
                [29.01, 41],
                [29.01, 41.01],
                [29, 41.01],
                [29, 41]
              ]
            ]
          }
        }
      ]
    };
    const r = validateAndRepairGeoJson(fc);
    expect(r.issues.some((i) => i.code === "INCOMPLETE_PARCEL_ID")).toBe(true);
  });
});

describe("ringSignedArea", () => {
  it("returns non-zero for a simple triangle", () => {
    const ring: GeoJSON.Position[] = [
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 0]
    ];
    expect(ringSignedArea(ring)).not.toBe(0);
  });
});
