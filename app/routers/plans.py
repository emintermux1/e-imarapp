import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.municipality import Municipality
from app.models.plan import Plan
from app.schemas.plan import (
    LatestRegionResponse,
    LatestRegionsResponse,
    PlanListResponse,
    PlanResponse,
)

router = APIRouter()


@router.get("/plans", response_model=PlanListResponse)
async def list_plans(
    municipality_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    plan_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Plan).offset(skip).limit(limit)
    if municipality_id:
        stmt = stmt.where(Plan.municipality_id == municipality_id)
    if status:
        stmt = stmt.where(Plan.status == status)
    if plan_type:
        stmt = stmt.where(Plan.plan_type == plan_type)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {"items": items, "total": len(items)}


@router.get("/plans/aski", response_model=PlanListResponse)
async def list_aski_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.status == "aski"))
    items = result.scalars().all()
    return {"items": items, "total": len(items)}


@router.get("/plans/latest-regions", response_model=LatestRegionsResponse)
async def list_latest_regions(
    limit: int = Query(20, ge=1, le=100),
    province: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    municipality_slug: Optional[str] = Query(None),
    has_geometry: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    geometry_sql = func.ST_AsGeoJSON(Plan.geom)
    stmt = (
        select(
            Plan.id,
            Plan.municipality_id,
            Plan.plan_type,
            Plan.status,
            Plan.aski_start,
            Plan.aski_end,
            Plan.pdf_url,
            Plan.gml_url,
            Municipality.name.label("municipality_name"),
            Municipality.slug.label("municipality_slug"),
            Municipality.province.label("province"),
            Municipality.district.label("district"),
            geometry_sql.label("geom_geojson"),
        )
        .select_from(Plan)
        .outerjoin(Municipality, Municipality.id == Plan.municipality_id)
    )
    if province:
        stmt = stmt.where(func.lower(Municipality.province) == province.strip().lower())
    if district:
        stmt = stmt.where(func.lower(Municipality.district) == district.strip().lower())
    if municipality_slug:
        stmt = stmt.where(Municipality.slug == municipality_slug.strip())
    if has_geometry is True:
        stmt = stmt.where(Plan.geom.is_not(None))
    elif has_geometry is False:
        stmt = stmt.where(Plan.geom.is_(None))

    freshness = func.coalesce(Plan.aski_end, Plan.aski_start)
    stmt = stmt.order_by(freshness.desc().nullslast(), Plan.id.desc()).limit(limit)

    result = await db.execute(stmt)
    rows = result.mappings().all()

    items = []
    geometry_count = 0
    for row in rows:
        geometry_payload = None
        raw_geometry = row.get("geom_geojson")
        if raw_geometry:
            try:
                geometry_payload = json.loads(raw_geometry)
            except (TypeError, json.JSONDecodeError):
                geometry_payload = None
        has_geom = geometry_payload is not None
        if has_geom:
            geometry_count += 1

        municipality_name = row.get("municipality_name")
        district_name = row.get("district")
        province_name = row.get("province")
        label_parts = [
            row.get("plan_type") or "İmar bölgesi",
            municipality_name,
            district_name,
            province_name,
        ]
        label = " · ".join(part for part in label_parts if part)

        items.append(
            LatestRegionResponse(
                id=row["id"],
                label=label or f"Plan #{row['id']}",
                municipality_id=row.get("municipality_id"),
                municipality_name=municipality_name,
                municipality_slug=row.get("municipality_slug"),
                province=province_name,
                district=district_name,
                plan_type=row.get("plan_type"),
                status=row.get("status"),
                aski_start=row.get("aski_start"),
                aski_end=row.get("aski_end"),
                pdf_url=row.get("pdf_url"),
                gml_url=row.get("gml_url"),
                source="live",
                has_geometry=has_geom,
                geom_geojson=geometry_payload,
            )
        )

    return LatestRegionsResponse(
        items=items,
        total=len(items),
        geometry_count=geometry_count,
        status="live",
        message=(
            "Seçili kayıtlar belediye plan veritabanından getirildi. "
            "Geometri olmayan satırlar listede tutuldu, haritada çizilmez."
        ),
    )


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan
