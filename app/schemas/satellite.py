from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime


class SentinelTileRequest(BaseModel):
    bbox: List[float]  # [minx, miny, maxx, maxy]
    date_from: str  # YYYY-MM-DD
    date_to: str    # YYYY-MM-DD
    cloud_cover: float = 20.0  # Max cloud cover percentage


class SentinelTileResponse(BaseModel):
    tile_id: str
    bbox: List[float]
    date_from: str
    date_to: str
    cloud_cover_percentage: float
    bands: List[str]
    resolution_m: int
    tile_path: str


class ChangeDetectionRequest(BaseModel):
    bbox: List[float]  # [minx, miny, maxx, maxy]
    date_before: str   # YYYY-MM-DD
    date_after: str    # YYYY-MM-DD


class ChangeDetectionResponse(BaseModel):
    type: str  # FeatureCollection
    features: List[Dict]
    detection_method: str
    date_before: str
    date_after: str


class IllegalConstructionRequest(BaseModel):
    bbox: List[float]  # [minx, miny, maxx, maxy]
    plan_geometry: Dict  # GeoJSON Polygon/MultiPolygon
    existing_buildings: List[Dict]  # List of GeoJSON Polygons


class IllegalConstructionResponse(BaseModel):
    type: str  # FeatureCollection
    features: List[Dict]
    analysis_date: str
    total_violations: int


class ConstructionProgressRequest(BaseModel):
    bbox: List[float]  # [minx, miny, maxx, maxy]
    construction_id: str
    dates: List[str]   # List of YYYY-MM-DD


class ConstructionProgressResponse(BaseModel):
    construction_id: str
    progress_timeline: List[Dict]
    total_estimated_area_m2: float
    current_progress_percentage: float


class EmptyParcelsRequest(BaseModel):
    bbox: List[float]  # [minx, miny, maxx, maxy]
    parcel_geoms: List[Dict]  # List of GeoJSON Polygons
    parcel_ids: List[str]     # Optional parcel identifiers


class EmptyParcelsResponse(BaseModel):
    type: str  # FeatureCollection
    features: List[Dict]
    analysis_date: str
    total_parcels_analyzed: int
    empty_parcels_count: int