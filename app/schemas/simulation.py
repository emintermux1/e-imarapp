from pydantic import BaseModel
from typing import Optional, Dict, List, Any

class BuildingVolumeRequest(BaseModel):
    footprint_geojson: Dict[str, Any]
    floors: int
    floor_height: float = 3.0
    building_type: str = "apartment"

class BuildingVolumeResponse(BaseModel):
    base_area_m2: float
    total_floor_area_m2: float
    volume_m3: float
    height_m: float
    floors: int
    floor_height: float
    cesium_bounding_box: Dict[str, Any]
    footprint_geojson: Optional[Dict[str, Any]] = None

class ShadowAnalysisRequest(BaseModel):
    footprint_geojson: Dict[str, Any]
    building_height: float
    sun_azimuth_deg: float
    sun_elevation_deg: float

class ShadowAnalysisResponse(BaseModel):
    shadow_geojson: Optional[Dict[str, Any]] = None
    shadow_length_m: float
    shadow_area_m2_approx: Optional[float] = None
    building_height_m: float
    sun_azimuth_deg: float
    sun_elevation_deg: float
    note: Optional[str] = None

class ComplianceRequest(BaseModel):
    footprint_geojson: Dict[str, Any]
    parcel_area_m2: float
    emsal: float
    gabari: float
    h_max: float
    floors: int
    floor_height: float = 3.0

class ComplianceResponse(BaseModel):
    compliant: bool
    emsal_compliant: bool
    emsal_required: float
    emsal_calculated: float
    hmax_compliant: bool
    hmax_required: float
    hmax_calculated: float
    gabari_compliant: bool
    gabari_required: float
    parcel_area_m2: float
    base_area_m2: float
    total_floor_area_m2: float
    violations: List[str]

class NeighborBuilding(BaseModel):
    footprint: Dict[str, Any]
    height: float

class NeighborVisibilityRequest(BaseModel):
    target_footprint: Dict[str, Any]
    target_height: float
    neighbor_buildings: List[NeighborBuilding]
    observer_height: float = 1.6

class NeighborVisibilityResponse(BaseModel):
    issues_found: int
    issues: List[Dict[str, Any]]
    status: str

class CesiumTilesetRequest(BaseModel):
    buildings: List[Dict[str, Any]]

class CesiumTilesetResponse(BaseModel):
    tileset: Dict[str, Any]
