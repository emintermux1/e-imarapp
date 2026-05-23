export function getMunicipalityBoundaryCollection(): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: [
      boundary("pendik", "Pendik Belediyesi", [29.18, 40.82, 29.39, 41.03]),
      boundary("esenler", "Esenler Belediyesi", [28.84, 41.02, 28.91, 41.08]),
      boundary("alanya", "Alanya Belediyesi", [31.86, 36.42, 32.55, 36.75]),
      boundary("konak", "Konak Belediyesi", [27.06, 38.37, 27.18, 38.47]),
      boundary(
        "merkezefendi",
        "Merkezefendi Belediyesi",
        [29.0, 37.7, 29.18, 37.86],
      ),
      boundary(
        "pamukkale",
        "Pamukkale Belediyesi",
        [29.04, 37.73, 29.35, 37.98],
      ),
      boundary(
        "kahramankazan",
        "Kahramankazan Belediyesi",
        [32.44, 40.02, 32.83, 40.34],
      ),
      boundary("tusba", "Tuşba Belediyesi", [43.23, 38.45, 43.57, 38.68]),
      boundary("aksaray", "Aksaray Belediyesi", [33.9, 38.28, 34.14, 38.48]),
      boundary(
        "sehitkamil",
        "Şehitkamil Belediyesi",
        [37.23, 37.01, 37.55, 37.25],
      ),
      boundary(
        "suleymanpasa",
        "Süleymanpaşa Belediyesi",
        [27.38, 40.88, 27.65, 41.1],
      ),
      boundary(
        "mustafakemalpasa",
        "Mustafakemalpaşa Belediyesi",
        [28.2, 39.9, 28.7, 40.25],
      ),
      boundary("gelibolu", "Gelibolu Belediyesi", [26.45, 40.33, 26.78, 40.52]),
      boundary("caycuma", "Çaycuma Belediyesi", [32.02, 41.33, 32.25, 41.52]),
      boundary(
        "canakkale",
        "Çanakkale Belediyesi",
        [26.35, 40.08, 26.48, 40.2],
      ),
      boundary(
        "cerkezkoy",
        "Çerkezköy Belediyesi",
        [27.95, 41.22, 28.12, 41.35],
      ),
      boundary(
        "sultangazi",
        "Sultangazi Belediyesi",
        [28.83, 41.08, 28.94, 41.15],
      ),
      boundary(
        "basaksehir",
        "Başakşehir Belediyesi",
        [28.64, 41.04, 28.85, 41.17],
      ),
      boundary(
        "altinordu",
        "Altınordu Belediyesi",
        [37.8, 40.88, 38.12, 41.05],
      ),
      boundary("kecioren", "Keçiören Belediyesi", [32.76, 39.94, 32.94, 40.08]),
      boundary(
        "ibb",
        "İstanbul Büyükşehir Belediyesi",
        [28.0, 40.8, 29.95, 41.65],
      ),
      boundary(
        "ankara",
        "Ankara Büyükşehir Belediyesi",
        [31.5, 39.2, 33.6, 40.5],
      ),
      boundary(
        "izmir",
        "İzmir Büyükşehir Belediyesi",
        [26.2, 37.85, 28.35, 39.35],
      ),
      boundary("cankaya", "Çankaya Belediyesi", [32.72, 39.84, 32.94, 40.0]),
    ],
  };
}

function boundary(
  id: string,
  name: string,
  bbox: [number, number, number, number],
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return {
    type: "Feature",
    properties: { id, name, kind: "İdari sınır", status: "unknown", bbox },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ],
      ],
    },
  };
}
