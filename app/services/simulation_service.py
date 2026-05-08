from typing import Dict, List, Optional, Tuple
import math
from shapely.geometry import Polygon, Point, mapping, box
from shapely.ops import unary_union, transform as shapely_transform

class BuildingSimulationService:
    """
    3D bina simülasyonu — Cesium.js entegrasyonu için geometrik analiz.
    Emsal, gabari, komşu görüş açısı, gölge analizi.
    """

    def calculate_building_volume(self, footprint_geojson: Dict,
                                   floors: int, floor_height: float = 3.0) -> Dict:
        """
        Bina hacmi ve 3D bounding box hesapla.
        footprint_geojson: GeoJSON Polygon (parsel veya bina footprint)
        """
        try:
            from shapely.geometry import shape
            geom = shape(footprint_geojson)
            base_area = geom.area  # Simple approx; actual area depends on CRS
            total_floor_area = base_area * floors
            height = floors * floor_height
            volume = base_area * height

            minx, miny, maxx, maxy = geom.bounds
            return {
                "base_area_m2": round(base_area, 2),
                "total_floor_area_m2": round(total_floor_area, 2),
                "height_m": round(height, 2),
                "volume_m3": round(volume, 2),
                "floors": floors,
                "floor_height": floor_height,
                "footprint_geojson": footprint_geojson,
                "cesium_bounding_box": {
                    "west": minx, "south": miny,
                    "east": maxx, "north": maxy,
                    "minimumHeight": 0.0,
                    "maximumHeight": height,
                }
            }
        except Exception as e:
            return {"error": str(e), "footprint_geojson": footprint_geojson}

    def calculate_shadow(self, footprint_geojson: Dict, building_height: float,
                         sun_azimuth_deg: float, sun_elevation_deg: float) -> Dict:
        """
        Güneş açısına göre gölge poligonu hesapla.
        sun_azimuth_deg: 0=kuzey, 90=doğu, 180=güney, 270=bati
        sun_elevation_deg: 0=ufuk, 90=zenit
        """
        try:
            from shapely.geometry import shape
            geom = shape(footprint_geojson)
            if sun_elevation_deg <= 0:
                return {"shadow_geojson": None, "shadow_length_m": 0, "note": "Gece — gölge yok"}

            shadow_length = building_height / math.tan(math.radians(sun_elevation_deg))
            azimuth_rad = math.radians(sun_azimuth_deg)
            # Shadow direction vector (from sun position, opposite of light)
            dx = shadow_length * math.sin(azimuth_rad)
            dy = shadow_length * math.cos(azimuth_rad)

            # Create shadow polygon by extruding footprint in opposite direction
            shadow = geom.buffer(0.0001)  # Simplify for now
            # True shadow extrusion requires more complex 3D math
            # Simplified: approximate shadow as footprint translated
            from shapely.affinity import translate
            shadow_geom = translate(geom, xoff=-dx/111320, yoff=-dy/111320)
            union_shadow = unary_union([geom, shadow_geom])

            return {
                "shadow_geojson": mapping(union_shadow),
                "shadow_length_m": round(shadow_length, 2),
                "building_height_m": building_height,
                "sun_azimuth_deg": sun_azimuth_deg,
                "sun_elevation_deg": sun_elevation_deg,
                "shadow_area_m2_approx": round(union_shadow.area, 2),
            }
        except Exception as e:
            return {"error": str(e)}

    def check_compliance(self, footprint_geojson: Dict, parcel_area_m2: float,
                          emsal: float, gabari: float, h_max: float,
                          floors: int, floor_height: float = 3.0) -> Dict:
        """
        Emsal, gabari ve hmax kurallarına uygunluk kontrolü.
        """
        try:
            from shapely.geometry import shape
            geom = shape(footprint_geojson)
            base_area = geom.area
            total_floor_area = base_area * floors
            calculated_emsal = total_floor_area / parcel_area_m2 if parcel_area_m2 > 0 else 0
            height = floors * floor_height

            emsal_ok = calculated_emsal <= emsal
            hmax_ok = height <= h_max
            gabari_ok = height <= gabari  # Gabari typically same as hmax or stricter

            return {
                "compliant": emsal_ok and hmax_ok and gabari_ok,
                "emsal_compliant": emsal_ok,
                "emsal_required": emsal,
                "emsal_calculated": round(calculated_emsal, 4),
                "hmax_compliant": hmax_ok,
                "hmax_required": h_max,
                "hmax_calculated": round(height, 2),
                "gabari_compliant": gabari_ok,
                "gabari_required": gabari,
                "parcel_area_m2": round(parcel_area_m2, 2),
                "base_area_m2": round(base_area, 2),
                "total_floor_area_m2": round(total_floor_area, 2),
                "violations": [
                    v for v in [
                        "Emsal aşıldı" if not emsal_ok else None,
                        "Hmax aşıldı" if not hmax_ok else None,
                        "Gabari aşıldı" if not gabari_ok else None,
                    ] if v
                ],
            }
        except Exception as e:
            return {"error": str(e)}

    def neighbor_visibility(self, target_footprint: Dict, target_height: float,
                            neighbor_footprints: List[Dict],
                            observer_height: float = 1.6) -> Dict:
        """
        Komşu binaların görüş açısı analizi.
        Simplified: 2D distance + height comparison.
        """
        from shapely.geometry import shape
        try:
            target = shape(target_footprint)
            issues = []
            for i, nf in enumerate(neighbor_footprints):
                n = shape(nf.get("footprint", nf))
                dist = target.distance(n)
                n_height = nf.get("height", 15)
                # Simplified visibility: if neighbor within 2x its height and taller
                if dist < n_height * 2 and n_height > target_height:
                    issues.append({
                        "neighbor_index": i,
                        "distance_m_approx": round(dist * 111320, 1),
                        "neighbor_height": n_height,
                        "target_height": target_height,
                        "issue": "Potansiyel görüş kısıtlaması"
                    })
            return {
                "issues_found": len(issues),
                "issues": issues,
                "status": "clear" if not issues else "warnings",
            }
        except Exception as e:
            return {"error": str(e)}

    def generate_cesium_tileset(self, buildings: List[Dict]) -> Dict:
        """
        Cesium 3D Tiles tileset.json üret.
        https://github.com/CesiumGS/3d-tiles/tree/main/specification
        """
        tiles = []
        for b in buildings:
            fp = b.get("footprint_geojson")
            height = b.get("height", b.get("floors", 1) * 3.0)
            try:
                from shapely.geometry import shape
                geom = shape(fp)
                minx, miny, maxx, maxy = geom.bounds
                tiles.append({
                    "boundingVolume": {
                        "region": [
                            minx, miny, maxx, maxy,
                            0.0, height
                        ]
                    },
                    "geometricError": 10.0,
                    "content": {
                        "uri": f"buildings/{b.get('id', 'unknown')}.b3dm"
                    }
                })
            except Exception:
                continue

        return {
            "asset": {"version": "1.0", "tilesetVersion": "1.0.0"},
            "geometricError": 500.0,
            "root": {
                "boundingVolume": {
                    "region": self._compute_global_region(buildings)
                },
                "geometricError": 500.0,
                "refine": "REPLACE",
                "children": tiles,
            }
        }

    def _compute_global_region(self, buildings: List[Dict]) -> List[float]:
        from shapely.geometry import shape
        from shapely.ops import unary_union
        geoms = []
        for b in buildings:
            try:
                geoms.append(shape(b.get("footprint_geojson")))
            except Exception:
                continue
        if not geoms:
            return [26.0, 36.0, 45.0, 42.0, 0.0, 100.0]
        u = unary_union(geoms)
        minx, miny, maxx, maxy = u.bounds
        max_height = max((b.get("height", b.get("floors", 1) * 3.0) for b in buildings), default=100.0)
        return [minx, miny, maxx, maxy, 0.0, max_height]
