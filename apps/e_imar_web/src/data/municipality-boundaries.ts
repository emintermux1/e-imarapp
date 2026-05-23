export function getMunicipalityBoundaryCollection(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: [
      boundary("sisli", "Şişli Belediyesi", [
        [28.955, 41.045],
        [29.035, 41.045],
        [29.035, 41.095],
        [28.955, 41.095],
        [28.955, 41.045]
      ]),
      boundary("kadikoy", "Kadıköy Belediyesi", [
        [29.000, 40.960],
        [29.105, 40.960],
        [29.105, 41.025],
        [29.000, 41.025],
        [29.000, 40.960]
      ]),
      boundary("cankaya", "Çankaya Belediyesi", [
        [32.730, 39.865],
        [32.930, 39.865],
        [32.930, 39.995],
        [32.730, 39.995],
        [32.730, 39.865]
      ]),
      boundary("konak", "Konak Belediyesi", [
        [27.075, 38.385],
        [27.185, 38.385],
        [27.185, 38.465],
        [27.075, 38.465],
        [27.075, 38.385]
      ])
    ]
  };
}

function boundary(
  id: string,
  name: string,
  ring: Array<[number, number]>
): GeoJSON.Feature<GeoJSON.Polygon> {
  return {
    type: "Feature",
    properties: { id, name, kind: "İdari sınır" },
    geometry: { type: "Polygon", coordinates: [ring] }
  };
}
