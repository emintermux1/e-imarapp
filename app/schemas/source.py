from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class SourceCoverageHints(BaseModel):
    has_geometry: bool = False
    has_imar: bool = False
    has_aski: bool = False
    has_documents: bool = False
    capabilities: list[str] = []


class SourceQualityRecord(BaseModel):
    source_id: str
    key: str
    name: str
    province: Optional[str] = None
    district: Optional[str] = None
    municipality_name: Optional[str] = None
    category: Optional[str] = None
    type: Optional[str] = None
    provider: Optional[str] = None
    status: str
    raw_status: Optional[str] = None
    last_checked_at: Optional[datetime | str] = None
    last_success_at: Optional[datetime | str] = None
    latency_ms: Optional[int | float] = None
    http_status: Optional[int] = None
    endpoint_url: Optional[str] = None
    service_url: Optional[str] = None
    failure_reason: Optional[str] = None
    coverage: SourceCoverageHints
    geometry_available: bool = False
    imar_available: bool = False
    aski_available: bool = False
    history_available: bool = False
    endpoint_count: int = 0
    discovered_endpoints: list[dict[str, Any]] = []
    next_action: Optional[str] = None
    user_message: Optional[str] = None


class SourceQualityResponse(BaseModel):
    status: str
    fetched_at: str
    history_available: bool = False
    total: int
    live_checked: bool = False
    rollup: dict[str, int]
    sources: list[SourceQualityRecord]
    message: Optional[str] = None
