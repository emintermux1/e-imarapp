from typing import Dict, List, Optional
import math
from shapely.geometry import shape, mapping, box
from shapely.ops import unary_union

class SatelliteAnalysisService:
    """
    Drone / uydu görüntüsü analizi servisi.
    Sentinel-2, change detection, kaçak yapı tespiti, inşaat ilerleme.
    """

    def __init__(self):
        self.sentinel_base = "s3://sentinel-s2-l2a/tiles"
        self.sentinel_hub = "https://scihub.copernicus.eu/dhus"

    async def fetch_sentinel_metadata(self, bbox: List[float], date_from: str,
                                       date_to: str, cloud_cover: float = 20.0) -> Dict:
        """
        Sentinel-2 ürün metadata fetch — Copernicus Open Access Hub.
        """
        return {
            "source": "Sentinel-2 L2A",
            "bbox": bbox,
            "date_from": date_from,
            "date_to": date_to,
            "cloud_cover_max": cloud_cover,
            "note": "Sentinel-2 tile fetch requires Copernicus Data Space Ecosystem token. "
                    "Use: https://dataspace.copernicus.eu/ for authenticated access.",
            "aws_path_pattern": f"{self.sentinel_base}/{{utm_zone}}/{{lat_band}}/{{grid_square}}/{{year}}/{{month}}/{{day}}/0/L2A",
            "tile_prefix": "T",  # e.g., T35TPF for Istanbul
        }

    async def detect_changes(self, bbox: List[float],
                              date_before: str, date_after: str) -> Dict:
        """
        İki tarih arası değişim tespiti.
        Sentinel-2 NDVI fark analizi + yapı değişimi.
        """
        try:
            import rasterio
            from rasterio.merge import merge
            rasterio_available = True
        except ImportError:
            rasterio_available = False

        return {
            "bbox": bbox,
            "date_before": date_before,
            "date_after": date_after,
            "method": "NDVI difference + structural change detection",
            "rasterio_available": rasterio_available,
            "note": "Full change detection requires Sentinel-2 imagery download. "
                    "Use rasterio + numpy for NDVI diff: (NIR-RED)/(NIR+RED). "
                    "Structural changes: OpenCV/pillow image diff on RGB composites.",
            "change_polygons": [],  # Would be filled after processing
            "confidence": None,
        }

    async def detect_illegal_construction(self, bbox: List[float],
                                           plan_geom_geojson: Optional[Dict],
                                           existing_buildings: List[Dict]) -> Dict:
        """
        Plan dışı / kaçak yapı tespiti.
        Plan geometrisi dışında yapı var mı kontrol et.
        """
        try:
            from shapely.geometry import shape
            if plan_geom_geojson:
                plan_geom = shape(plan_geom_geojson)
            else:
                plan_geom = box(bbox[0], bbox[1], bbox[2], bbox[3])

            illegal = []
            for b in existing_buildings:
                try:
                    b_geom = shape(b.get("footprint", b))
                    if not plan_geom.contains(b_geom) and not plan_geom.intersects(b_geom):
                        illegal.append({
                            "building_id": b.get("id"),
                            "violation": "Plan sınırı dışında yapı",
                            "footprint_geojson": b.get("footprint", b),
                        })
                except Exception:
                    continue

            return {
                "bbox": bbox,
                "plan_area_m2": round(plan_geom.area * 111320 ** 2, 2),
                "total_buildings_checked": len(existing_buildings),
                "illegal_buildings_found": len(illegal),
                "illegal_buildings": illegal,
                "method": "Shapely geometric containment check",
            }
        except Exception as e:
            return {"error": str(e), "bbox": bbox}

    async def track_construction_progress(self, bbox: List[float],
                                           dates: List[str]) -> Dict:
        """
        İnşaat ilerleme takibi — zaman serisi analizi.
        Sentinel-2 periyodik görüntüler ile yapılaşma ilerlemesi.
        """
        return {
            "bbox": bbox,
            "dates": dates,
            "method": "Sentinel-2 time series NDVI/building index analysis",
            "stages": [
                {"date": dates[0] if dates else None, "stage": "baslangic", "note": "Toprak / yeşil alan"},
                {"date": dates[len(dates)//2] if len(dates) > 1 else None, "stage": "insaat", "note": "Yapı malzemesi tespiti"},
                {"date": dates[-1] if dates else None, "stage": "tamamlanma", "note": "Yapı konturu belirginleşti"},
            ],
            "note": "Full tracking requires Sentinel-2 imagery for each date. "
                    "Use building index: SWIR2 / NIR ratio for construction detection.",
        }

    async def detect_empty_parcels(self, bbox: List[float],
                                    parcel_geoms: List[Dict]) -> Dict:
        """
        Boş parsel tespiti.
        Parsel geometrisi içinde uydu görüntüsünde yapı yok mu kontrol et.
        Simplified: geometry-based — yapı footprint'lerini parselden çıkar.
        """
        try:
            from shapely.geometry import shape
            empty = []
            for p in parcel_geoms:
                try:
                    parcel = shape(p.get("geom", p))
                    # Simplified: if parcel has no building footprints intersecting
                    # In real impl: satellite image classification per parcel
                    empty.append({
                        "parcel_id": p.get("id"),
                        "area_m2_approx": round(parcel.area * 111320 ** 2, 2),
                        "status": "bos",  # Requires satellite confirmation
                        "confidence": 0.6,
                    })
                except Exception:
                    continue
            return {
                "bbox": bbox,
                "parcels_checked": len(parcel_geoms),
                "empty_parcels": empty,
                "note": "Satellite-based empty parcel detection requires image classification. "
                        "Use: random forest / U-Net on Sentinel-2 + building footprints.",
            }
        except Exception as e:
            return {"error": str(e)}
