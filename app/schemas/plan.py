from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date

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
