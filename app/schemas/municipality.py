from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class MunicipalityResponse(BaseModel):
    id: int
    name: str
    province: Optional[str] = None
    district: Optional[str] = None
    slug: str
    type: Optional[str] = None
    keos_url: Optional[str] = None
    wms_url: Optional[str] = None
    wfs_url: Optional[str] = None
    discovered_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class MunicipalityDiscoveryResponse(BaseModel):
    slug: str
    name: str
    tested_patterns: int
    live_endpoints: List[Dict[str, Any]]
    keos_url: Optional[str] = None
    wms_url: Optional[str] = None
    wfs_url: Optional[str] = None
    discovered_at: str

class ImarStatusResponse(BaseModel):
    belediye: str
    ada: str
    parsel: str
    imar_durumu: Optional[str] = None
    plan_turu: Optional[str] = None
    taks: Optional[float] = None
    kaks: Optional[float] = None
    h_max: Optional[float] = None
    gabari: Optional[str] = None
    yapilasma_sarti: Optional[str] = None
    kullanim_amaci: Optional[str] = None
    aciklama: Optional[str] = None
