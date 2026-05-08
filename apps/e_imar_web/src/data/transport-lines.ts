export function getTransportLineCollection(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "m2-sisli", name: "M2 Yenikapı–Hacıosman", kind: "Metro" },
        geometry: {
          type: "LineString",
          coordinates: [
            [28.9769, 41.0082],
            [28.9871, 41.0369],
            [28.9922, 41.0632],
            [28.9915, 41.0777],
            [29.0056, 41.1091]
          ]
        }
      },
      {
        type: "Feature",
        properties: { id: "m4-kadikoy", name: "M4 Kadıköy–Sabiha Gökçen", kind: "Metro" },
        geometry: {
          type: "LineString",
          coordinates: [
            [29.0215, 40.9905],
            [29.0577, 40.9847],
            [29.1008, 40.9927],
            [29.1514, 40.9972],
            [29.2315, 40.8986]
          ]
        }
      },
      {
        type: "Feature",
        properties: { id: "ankaray", name: "Ankaray / Metro Koridoru", kind: "Raylı Sistem" },
        geometry: {
          type: "LineString",
          coordinates: [
            [32.7767, 39.9535],
            [32.8234, 39.9334],
            [32.8541, 39.9208],
            [32.8986, 39.9117]
          ]
        }
      },
      {
        type: "Feature",
        properties: { id: "izmir-metro", name: "İzmir Metro / Tram Koridoru", kind: "Raylı Sistem" },
        geometry: {
          type: "LineString",
          coordinates: [
            [27.0897, 38.4612],
            [27.1287, 38.4382],
            [27.1441, 38.4248],
            [27.1758, 38.4003]
          ]
        }
      }
    ]
  };
}
