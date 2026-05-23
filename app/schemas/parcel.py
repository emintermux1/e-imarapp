from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

from app.schemas.parcel_context import ParcelQualityMetadata, ParcelSourceMetadata


class ParcelResponse(BaseModel):
    id: int
    ada: str
    parsel: str
    il: Optional[str] = None
    ilce: Optional[str] = None
    mahalle: Optional[str] = None
    nitelik: Optional[str] = None
    alan_m2: Optional[float] = None
    tapu_durumu: Optional[str] = None
    geometri: Optional[Dict[str, Any]] = None
    pafta: Optional[str] = None
    mevkii: Optional[str] = None
    created_at: Optional[datetime] = None
    geometry_available: Optional[bool] = None
    source_status: Optional[str] = None
    source_name: Optional[str] = None
    source_municipality: Optional[str] = None
    source_provider: Optional[str] = None
    source: Optional[ParcelSourceMetadata] = None
    confidence: Optional[float] = None
    confidence_label: Optional[str] = None
    quality_hints: Optional[list[str]] = None
    plan_match_status: Optional[str] = None
    aski_match_status: Optional[str] = None
    imar_params_status: Optional[str] = None
    status_message: Optional[str] = None
    quality: Optional[ParcelQualityMetadata] = None

    model_config = {"from_attributes": True}

class ParcelSearchRequest(BaseModel):
    query: str
    il: Optional[str] = None
    ilce: Optional[str] = None
    limit: int = 20

class ParcelGeometryResponse(BaseModel):
    parcel_id: int
    ada: str
    parsel: str
    geojson: Optional[Dict[str, Any]] = None
    wkt: Optional[str] = None
