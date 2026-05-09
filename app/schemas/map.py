from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LayerInfo(BaseModel):
    name: str
    title: Optional[str] = None
    abstract: Optional[str] = None
    bounding_box_wgs84: Optional[List[float]] = None
    crs_options: Optional[List[str]] = None
    styles: Optional[List[str]] = None

class LayerListResponse(BaseModel):
    service_type: str  # WMS or WFS
    identification: Optional[Dict[str, Any]] = None
    layers: List[LayerInfo]
    url: str
