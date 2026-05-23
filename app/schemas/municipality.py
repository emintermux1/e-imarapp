from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

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
    refresh_after: Optional[str] = None
    ogc: Optional[Dict[str, Any]] = None


class MunicipalGISEndpointResponse(BaseModel):
    id: str
    source_id: str
    municipality_id: Optional[int] = None
    base_url: str
    wms_url: str
    wms_get_capabilities_url: str
    wms_version: Optional[str] = None
    wfs_url: Optional[str] = None
    wfs_get_capabilities_url: Optional[str] = None
    available_layers: List[Dict[str, Any]]
    supported_srs: List[str]
    supported_formats: List[str]
    status: str
    discovered_at: datetime
    refresh_after: datetime
    last_error: Optional[str] = None
    metadata: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

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
