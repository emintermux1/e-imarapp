from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

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
