from pydantic import BaseModel
from typing import Dict, List, Optional


class BuildingVolumeRequest(BaseModel):
    footprint_geojson: Dict  # GeoJSON Polygon
    floors: int
    floor_height: float = 3.0
    building_type: str = "apartment"


class BuildingVolumeResponse(BaseModel):
    base_area_m2: float
    total_floor_area_m2: float
    volume_m3: float
    height_m: float
    cesium_bounding_box: Dict  # {west, south, east, north, minimumHeight, maximumHeight}
    building_geometry: Dict


class ShadowAnalysisRequest(BaseModel):
    building_geometry: Dict  # GeoJSON Polygon or MultiPolygon
    sun_azimuth: float  # degrees (0=north, 90=east)
    sun_elevation: float  # degrees (0=horizon, 90=zenith)
    building_height: float  # meters


class ShadowAnalysisResponse(BaseModel):
    shadow_length_m: Optional[float]
    shadow_direction: Dict  # {dx, dy}
    shadow_polygon: Optional[Dict]  # GeoJSON Polygon
    building_height: float


class NeighborVisibilityRequest(BaseModel):
    target_building_id: str
    target_building: Dict  # GeoJSON Polygon
    target_height: float
    neighbor_buildings: List[Dict]  # List of GeoJSON Polygons
    neighbor_heights: List[float]


class NeighborVisibilityResponse(BaseModel):
    target_building_id: str
    visibility_results: List[Dict]


class ComplianceRequest(BaseModel):
    parcel_geometry: Dict  # GeoJSON Polygon
    building_geometry: Dict  # GeoJSON Polygon
    floors: int
    floor_height: float
    max_emsal: float
    max_gabari: float
    max_height: float


class ComplianceResponse(BaseModel):
    emsal_analysis: Dict
    gabari_analysis: Dict
    height_analysis: Dict
    overall_compliance: bool


class CesiumTilesetRequest(BaseModel):
    buildings: List[Dict]  # List of GeoJSON features with properties
    default_height: Optional[float] = 10.0


class CesiumTilesetResponse(BaseModel):
    tileset: Dict  # Cesium 3D Tiles tileset.json structure