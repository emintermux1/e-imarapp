from pydantic import BaseModel
from typing import Dict, List, Optional


class MergeableParcelsRequest(BaseModel):
    parcel_ids: List[int]


class MergeableParcelsResponse(BaseModel):
    parcel_ids: List[int]
    mergeable_combinations: List[Dict]
    total_combinations: int


class AreaValueRequest(BaseModel):
    parcel_id: int


class AreaValueResponse(BaseModel):
    parcel_id: int
    estimated_value_try: float
    confidence: float
    currency: str
    comparables: List[Dict]
    valuation_date: str
    factors: Dict[str, float]


class ImarChangesRequest(BaseModel):
    plan_id: str
    old_plan: Dict  # GeoJSON Feature with properties
    new_plan: Dict  # GeoJSON Feature with properties


class ImarChangesResponse(BaseModel):
    plan_id: str
    changes_detected: bool
    significant_changes: List[Dict]
    geometric_overlap: float
    analysis_date: str


class PlanLegendRequest(BaseModel):
    pdf_url: str


class PlanLegendResponse(BaseModel):
    pdf_url: str
    legend_entries: List[Dict]
    total_categories: int
    parse_confidence: float
    extraction_date: str