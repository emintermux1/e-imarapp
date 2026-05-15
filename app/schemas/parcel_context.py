from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel


class ParcelSourceMetadata(BaseModel):
    source_id: Optional[str] = None
    source_name: Optional[str] = None
    municipality: Optional[str] = None
    provider: Optional[str] = None
    source_status: str = "fallback"
    source_message: Optional[str] = None
    last_checked_at: Optional[datetime | str] = None


class ParcelQualityMetadata(BaseModel):
    geometry_available: bool
    source_status: str
    source_name: Optional[str] = None
    source_municipality: Optional[str] = None
    source_provider: Optional[str] = None
    confidence: Optional[float] = None
    confidence_label: str
    quality_hints: list[str] = []
    plan_match_status: str = "unknown"
    aski_match_status: str = "unknown"
    imar_params_status: str = "unknown"
    message: Optional[str] = None


class RelatedPlanItem(BaseModel):
    id: int
    label: str
    municipality_id: Optional[int] = None
    municipality_name: Optional[str] = None
    municipality_slug: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    status: Optional[str] = None
    plan_type: Optional[str] = None
    aski_start: Optional[date] = None
    aski_end: Optional[date] = None
    pdf_url: Optional[str] = None
    gml_url: Optional[str] = None
    has_geometry: bool = False
    geom_geojson: Optional[dict[str, Any]] = None
    relation: str = "candidate"


class ParcelContextResponse(BaseModel):
    parcel: dict[str, Any]
    quality: ParcelQualityMetadata
    match_method: str
    related_plans: list[RelatedPlanItem]
    active_aski_plans: list[RelatedPlanItem]
    total_related: int
    geometry_included: bool = False
    history_available: bool = False
    generated_at: datetime | str
    message: Optional[str] = None


class ParcelSummaryResponse(BaseModel):
    parcel: dict[str, Any]
    location: dict[str, Optional[str]]
    geometry_status: str
    source_trust: ParcelSourceMetadata
    related_plan_count: int
    related_aski_count: int
    report_eligibility: str
    warnings: list[str]
    generated_at: datetime | str
