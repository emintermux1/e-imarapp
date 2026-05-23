from __future__ import annotations

from collections import Counter
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import now_iso
from app.core.security import get_current_user_id
from app.database import get_db
from app.models.report import Report
from app.models.user import User
from app.schemas.admin import (
    AdminAnalyticsPoint,
    AdminAnalyticsResponse,
    AdminDashboardResponse,
    AdminListMeta,
    AdminMeta,
    AdminMetric,
    AdminReportRecord,
    AdminReportsResponse,
    AdminSourceRecord,
    AdminSourcesResponse,
    AdminUserRecord,
    AdminUsersResponse,
)
from app.sources.registry import SourceEntry, list_sources

router = APIRouter()

ADMIN_DATA_NOTICE = (
    "Admin MVP data is database-derived, registry-derived, or explicitly labelled demo. "
    "Responses do not claim official live zoning, parcel, or municipal data."
)


def _meta(user_id: int) -> AdminMeta:
    return AdminMeta(generated_at=now_iso(), requested_by_user_id=user_id, data_notice=ADMIN_DATA_NOTICE)


def _rollup(sources: list[SourceEntry]) -> dict[str, dict[str, int]]:
    provider = Counter(src.provider.value for src in sources)
    category = Counter(src.category.value for src in sources)
    auth = Counter(src.auth.value for src in sources)
    capability = Counter(capability for src in sources for capability in src.capabilities)
    return {
        "provider": dict(sorted(provider.items())),
        "category": dict(sorted(category.items())),
        "auth": dict(sorted(auth.items())),
        "capability": dict(sorted(capability.items())),
    }


async def _count(db: AsyncSession, model: Any) -> tuple[int, str]:
    try:
        result = await db.execute(select(func.count()).select_from(model))
        return int(result.scalar_one() or 0), "available"
    except Exception:
        return 0, "unavailable"


async def _recent_users(db: AsyncSession, limit: int, offset: int) -> tuple[list[AdminUserRecord], int, str]:
    total, db_status = await _count(db, User)
    if db_status != "available":
        return [], 0, db_status
    try:
        result = await db.execute(select(User).order_by(desc(User.created_at), desc(User.id)).offset(offset).limit(limit))
        rows = result.scalars().all()
        return [
            AdminUserRecord(id=row.id, email=row.email, is_active=row.is_active, created_at=row.created_at)
            for row in rows
        ], total, "available"
    except Exception:
        return [], 0, "unavailable"


async def _recent_reports(db: AsyncSession, limit: int, offset: int) -> tuple[list[AdminReportRecord], int, str]:
    total, db_status = await _count(db, Report)
    if db_status != "available":
        return [], 0, db_status
    try:
        result = await db.execute(select(Report).order_by(desc(Report.created_at), desc(Report.id)).offset(offset).limit(limit))
        rows = result.scalars().all()
        return [
            AdminReportRecord(
                id=row.id,
                user_id=row.user_id,
                parcel_id=row.parcel_id,
                plan_id=row.plan_id,
                status=row.status,
                created_at=row.created_at,
            )
            for row in rows
        ], total, "available"
    except Exception:
        return [], 0, "unavailable"


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def admin_dashboard(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sources = list_sources()
    users_count, users_db_status = await _count(db, User)
    reports_count, reports_db_status = await _count(db, Report)
    warnings = []
    if users_db_status != "available" or reports_db_status != "available":
        warnings.append("Database metrics are unavailable; database-derived counts are returned as 0.")
    return AdminDashboardResponse(
        status="admin_mvp",
        meta=_meta(user_id),
        metrics=[
            AdminMetric(key="users_total", label="Users", value=users_count, data_source="database-derived", description=users_db_status),
            AdminMetric(key="reports_total", label="Reports", value=reports_count, data_source="database-derived", description=reports_db_status),
            AdminMetric(key="sources_total", label="Registered sources", value=len(sources), data_source="registry-derived"),
            AdminMetric(
                key="public_registry_sources",
                label="Public registry sources",
                value=sum(1 for src in sources if src.auth.value == "public"),
                data_source="registry-derived",
            ),
        ],
        warnings=warnings,
    )


@router.get("/users", response_model=AdminUsersResponse)
async def admin_users(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    users, total, db_status = await _recent_users(db, limit, offset)
    return AdminUsersResponse(
        meta=AdminListMeta(total=total, limit=limit, offset=offset, data_source="database-derived", db_status=db_status),
        users=users,
    )


@router.get("/sources", response_model=AdminSourcesResponse)
async def admin_sources(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    category: str | None = Query(None),
    provider: str | None = Query(None),
    user_id: int = Depends(get_current_user_id),
):
    sources = list_sources()
    if category:
        sources = [src for src in sources if src.category.value == category]
    if provider:
        sources = [src for src in sources if src.provider.value == provider]
    page = sources[offset : offset + limit]
    return AdminSourcesResponse(
        meta=AdminListMeta(total=len(sources), limit=limit, offset=offset, data_source="registry-derived"),
        rollup=_rollup(sources),
        sources=[
            AdminSourceRecord(
                id=src.id,
                name=src.name,
                provider=src.provider.value,
                category=src.category.value,
                auth=src.auth.value,
                discovery_strategy=src.discovery_strategy,
                capabilities=src.capabilities,
                municipality_name=src.municipality_name,
            )
            for src in page
        ],
    )


@router.get("/reports", response_model=AdminReportsResponse)
async def admin_reports(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    reports, total, db_status = await _recent_reports(db, limit, offset)
    return AdminReportsResponse(
        meta=AdminListMeta(total=total, limit=limit, offset=offset, data_source="database-derived", db_status=db_status),
        reports=reports,
    )


@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def admin_analytics(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sources = list_sources()
    users_count, users_db_status = await _count(db, User)
    reports_count, reports_db_status = await _count(db, Report)
    return AdminAnalyticsResponse(
        status="admin_mvp",
        meta=_meta(user_id),
        registry_breakdown=_rollup(sources),
        database_metrics=[
            AdminMetric(key="users_total", label="Users", value=users_count, data_source="database-derived", description=users_db_status),
            AdminMetric(key="reports_total", label="Reports", value=reports_count, data_source="database-derived", description=reports_db_status),
        ],
        demo_trends=[
            AdminAnalyticsPoint(label="Week 1 demo activity", value=max(users_count, 1), data_source="demo-placeholder"),
            AdminAnalyticsPoint(label="Week 2 demo activity", value=max(users_count + reports_count, 2), data_source="demo-placeholder"),
            AdminAnalyticsPoint(label="Week 3 demo activity", value=max(reports_count, 1), data_source="demo-placeholder"),
        ],
        notes=[
            "Registry breakdowns are derived from the checked-in public source registry.",
            "Trend points are explicitly demo placeholders for admin UI wiring and are not live usage analytics.",
        ],
    )
