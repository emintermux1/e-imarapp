from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WatchlistItemRequest(BaseModel):
    parcel_id: Optional[int] = None
    plan_id: Optional[int] = None
    geom_wkt: Optional[str] = None
    notification_channels: List[str] = ["push", "email"]
    label: Optional[str] = None

class WatchlistItemResponse(BaseModel):
    id: int
    user_id: int
    parcel_id: Optional[int] = None
    plan_id: Optional[int] = None
    geom_wkt: Optional[str] = None
    notification_channels: List[str]
    label: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
