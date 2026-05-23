import pyproj
from shapely.geometry import shape, mapping
from shapely.ops import transform as shapely_transform
from typing import Dict, Union, Optional, Any

class CoordinateTransformService:
    """
    Türkiye koordinat dönüşüm servisi.
    Desteklenen sistemler: ED50, WGS84, ITRF96, ITRF2000, ITRF2008.
    """
    CRS_MAP = {
        "ED50": "EPSG:4230",
        "WGS84": "EPSG:4326",
        "ITRF96": "EPSG:8991",
        "ITRF2000": "EPSG:8992",
        "ITRF2008": "EPSG:9000",
        "TM30": "EPSG:5254",      # Türkiye 3 derece kesmeli izdüşüm
        "LCC": "EPSG:5636",       # Lambert Conformal Conic
    }

    def __init__(self):
        self._transformers: Dict[str, pyproj.Transformer] = {}

    def _get_transformer(self, from_crs: str, to_crs: str) -> pyproj.Transformer:
        key = f"{from_crs}_to_{to_crs}"
        if key not in self._transformers:
            from_epsg = self.CRS_MAP.get(from_crs, from_crs)
            to_epsg = self.CRS_MAP.get(to_crs, to_crs)
            self._transformers[key] = pyproj.Transformer.from_crs(
                from_epsg, to_epsg, always_xy=True
            )
        return self._transformers[key]

    def transform_point(self, x: float, y: float, from_crs: str, to_crs: str) -> Dict[str, Any]:
        """Tek nokta dönüşümü (always_xy = lon/lat veya X/Y)."""
        transformer = self._get_transformer(from_crs, to_crs)
        lon, lat = transformer.transform(x, y)
        return {
            "x": lon, "y": lat,
            "from_crs": from_crs, "to_crs": to_crs,
            "from_epsg": self.CRS_MAP.get(from_crs, from_crs),
            "to_epsg": self.CRS_MAP.get(to_crs, to_crs),
        }

    def transform_geometry(self, geometry: Union[Dict[str, Any], Any],
                           from_crs: str, to_crs: str) -> Dict[str, Any]:
        """GeoJSON dict veya shapely geometry'yi dönüştür."""
        geom = shape(geometry) if isinstance(geometry, dict) else geometry
        transformer = self._get_transformer(from_crs, to_crs)
        transformed = shapely_transform(
            lambda x, y: transformer.transform(x, y),
            geom
        )
        return {
            "geojson": mapping(transformed),
            "wkt": transformed.wkt,
            "from_crs": from_crs,
            "to_crs": to_crs,
            "bbox": list(transformed.bounds),
        }

    def transform_bbox(self, minx: float, miny: float, maxx: float, maxy: float,
                       from_crs: str, to_crs: str) -> Dict[str, float]:
        """Bounding box dönüşümü."""
        p1 = self.transform_point(minx, miny, from_crs, to_crs)
        p2 = self.transform_point(maxx, maxy, from_crs, to_crs)
        return {"minx": p1["x"], "miny": p1["y"], "maxx": p2["x"], "maxy": p2["y"]}
