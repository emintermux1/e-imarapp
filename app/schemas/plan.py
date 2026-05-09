from datetime import date
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class PlanResponse(BaseModel):
    id: int
    municipality_id: Optional[int] = None
    plan_type: Optional[str] = None
    status: Optional[str] = None
    aski_start: Optional[date] = None
    aski_end: Optional[date] = None
    pdf_url: Optional[str] = None
    gml_url: Optional[str] = None
    geom_geojson: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class PlanListResponse(BaseModel):
    items: List[PlanResponse]
    total: int


class LatestRegionResponse(BaseModel):
    id: int
    label: str
    municipality_id: Optional[int] = None
    municipality_name: Optional[str] = None
    municipality_slug: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    plan_type: Optional[str] = None
    status: Optional[str] = None
    aski_start: Optional[date] = None
    aski_end: Optional[date] = None
    pdf_url: Optional[str] = None
    gml_url: Optional[str] = None
    source: str = "live"
    has_geometry: bool
    geom_geojson: Optional[Dict[str, Any]] = None


class LatestRegionsResponse(BaseModel):
    items: List[LatestRegionResponse]
    total: int
    geometry_count: int
    status: str = "live"
    message: Optional[str] = None
