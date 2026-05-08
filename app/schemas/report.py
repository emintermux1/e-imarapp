from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReportRequest(BaseModel):
    parcel_id: Optional[int] = None
    plan_id: Optional[int] = None
    report_type: str = "parcel"  # parcel, plan, combined
    include_map: bool = True
    include_tapu: bool = True
    include_imar: bool = True

class ReportResponse(BaseModel):
    id: int
    user_id: int
    parcel_id: Optional[int] = None
    plan_id: Optional[int] = None
    status: str
    pdf_url: Optional[str] = None
    share_token: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}