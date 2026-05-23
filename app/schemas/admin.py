from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AdminMeta(BaseModel):
    generated_at: str
    requested_by_user_id: int
    data_notice: str


class AdminMetric(BaseModel):
    key: str
    label: str
    value: int | float
    data_source: str
    description: str | None = None


class AdminListMeta(BaseModel):
    total: int
    limit: int
    offset: int = 0
    data_source: str
    db_status: str | None = None


class AdminDashboardResponse(BaseModel):
    status: str
    meta: AdminMeta
    metrics: list[AdminMetric]
    warnings: list[str] = Field(default_factory=list)


class AdminUserRecord(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime | str | None = None
    data_source: str = "database-derived"


class AdminUsersResponse(BaseModel):
    meta: AdminListMeta
    users: list[AdminUserRecord]


class AdminSourceRecord(BaseModel):
    id: str
    name: str
    provider: str
    category: str
    auth: str
    discovery_strategy: str
    capabilities: list[str]
    municipality_name: str | None = None
    data_source: str = "registry-derived"


class AdminSourcesResponse(BaseModel):
    meta: AdminListMeta
    rollup: dict[str, dict[str, int]]
    sources: list[AdminSourceRecord]


class AdminReportRecord(BaseModel):
    id: int
    user_id: int
    parcel_id: int | None = None
    plan_id: int | None = None
    status: str | None = None
    created_at: datetime | str | None = None
    data_source: str = "database-derived"


class AdminReportsResponse(BaseModel):
    meta: AdminListMeta
    reports: list[AdminReportRecord]


class AdminAnalyticsPoint(BaseModel):
    label: str
    value: int | float
    data_source: str


class AdminAnalyticsResponse(BaseModel):
    status: str
    meta: AdminMeta
    registry_breakdown: dict[str, dict[str, int]]
    database_metrics: list[AdminMetric]
    demo_trends: list[AdminAnalyticsPoint]
    notes: list[str]
    extra: dict[str, Any] = Field(default_factory=dict)
