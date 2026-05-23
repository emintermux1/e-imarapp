from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import envelope
from app.database import get_db
from app.models.parcel import Parcel
from app.schemas.parcel import ParcelResponse
from app.schemas.parcel_context import ParcelContextResponse, ParcelSummaryResponse
from app.services.netcad_keos_service import NetcadKeosService
from app.services.parcel_context import (
    build_quality_metadata,
    build_source_metadata,
    find_best_source,
    get_parcel_or_none,
    get_related_plan_rows,
    parcel_identity,
    rows_to_related_plans,
    utc_now,
)
from app.services.tkgm_service import TKGMService
from app.sources.registry import get_source

router = APIRouter()


def _parse_geojson(raw: Any) -> dict[str, Any] | None:
    if not raw:
        return None
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return None


def _parcel_response(parcel: Parcel, geom_geojson: Any = None) -> ParcelResponse:
    source = find_best_source(parcel.province, parcel.district, parcel.municipality)
    quality = build_quality_metadata(parcel=parcel, source=source)
    source_meta = build_source_metadata(source)
    geometry = _parse_geojson(geom_geojson)
    if geometry is None and parcel.geom is None:
        geometry = None
    return ParcelResponse(
        id=parcel.id,
        ada=parcel.ada,
        parsel=parcel.parsel,
        il=parcel.province,
        ilce=parcel.district,
        mahalle=parcel.mahalle,
        nitelik=parcel.nitelik,
        alan_m2=parcel.alan_m2,
        tapu_durumu=parcel.tapu_status,
        geometri=geometry,
        geometry_available=parcel.geom is not None,
        source_status=quality.source_status,
        source_name=quality.source_name,
        source_municipality=quality.source_municipality,
        source_provider=quality.source_provider,
        source=source_meta,
        confidence=quality.confidence,
        confidence_label=quality.confidence_label,
        quality_hints=quality.quality_hints,
        plan_match_status=quality.plan_match_status,
        aski_match_status=quality.aski_match_status,
        imar_params_status=quality.imar_params_status,
        status_message=quality.message,
        quality=quality,
    )


@router.get("/parsel/search", response_model=list[ParcelResponse])
async def search_parcels(
    query: str = Query(..., min_length=1),
    il: str | None = Query(None),
    ilce: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    term = f"%{query.strip().lower()}%"
    stmt = select(Parcel, func.ST_AsGeoJSON(Parcel.geom).label("geom_geojson")).where(
        or_(
            func.lower(Parcel.ada).like(term),
            func.lower(Parcel.parsel).like(term),
            func.lower(Parcel.mahalle).like(term),
            func.lower(Parcel.municipality).like(term),
            func.concat(Parcel.ada, "/", Parcel.parsel).like(term),
        )
    )
    if il:
        stmt = stmt.where(func.lower(Parcel.province) == il.strip().lower())
    if ilce:
        stmt = stmt.where(func.lower(Parcel.district) == ilce.strip().lower())
    result = await db.execute(stmt.limit(limit))
    return [_parcel_response(parcel, geom_geojson) for parcel, geom_geojson in result.all()]


@router.get("/parsel", response_model=None)
async def get_parcel(
    ada: str,
    parsel: str,
    il: str | None = None,
    ilce: str | None = None,
    source_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if source_id:
        src = get_source(source_id)
        if not src:
            return envelope("invalid_input", message="source_id bulunamadı.")
        if src.id.startswith("bel."):
            service = NetcadKeosService()
            return await service.discover_source(src)

    stmt = select(Parcel, func.ST_AsGeoJSON(Parcel.geom).label("geom_geojson")).where(
        Parcel.ada == ada,
        Parcel.parsel == parsel,
    )
    if il:
        stmt = stmt.where(func.lower(Parcel.province) == il.strip().lower())
    if ilce:
        stmt = stmt.where(func.lower(Parcel.district) == ilce.strip().lower())
    result = await db.execute(stmt.limit(25))
    rows = result.all()
    if rows:
        return [_parcel_response(parcel, geom_geojson) for parcel, geom_geojson in rows]

    service = TKGMService()
    return await service.get_parcel_data(ada, parsel, il, ilce)


@router.get("/parsel/geometry/{parcel_id}")
async def get_parcel_geometry(parcel_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.ST_AsGeoJSON(Parcel.geom)).where(Parcel.id == parcel_id))
    raw = result.scalar_one_or_none()
    if raw is None:
        raise HTTPException(status_code=404, detail="Parcel geometry not found")
    return _parse_geojson(raw) or {}


@router.get("/parsel/{parcel_id}/context", response_model=ParcelContextResponse)
async def get_parcel_context(
    parcel_id: int,
    include_geometry: bool = Query(False),
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    parcel = await get_parcel_or_none(db, parcel_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    rows, match_method = await get_related_plan_rows(db, parcel, limit=limit, include_geometry=include_geometry)
    related = rows_to_related_plans(rows, include_geometry=include_geometry, relation=match_method if match_method != "none" else "metadata_match")
    aski = [item for item in related if (item.status or "").lower() == "aski"]
    source = find_best_source(parcel.province, parcel.district, parcel.municipality)
    quality = build_quality_metadata(parcel=parcel, source=source, related_count=len(related), aski_count=len(aski))
    return ParcelContextResponse(
        parcel=parcel_identity(parcel),
        quality=quality,
        match_method=match_method,
        related_plans=related,
        active_aski_plans=aski,
        total_related=len(related),
        geometry_included=include_geometry,
        history_available=False,
        generated_at=utc_now(),
        message=(
            "Spatial kesişim kullanılmadı; plan kayıtları belediye/ilçe/il metadatası ile eşleştirildi."
            if match_method != "none"
            else "Bu parsel için plan/askı ilişkisi hesaplanamadı; eşleşebilir belediye metadatası yok."
        ),
    )


@router.get("/parsel/{parcel_id}/related-plans", response_model=ParcelContextResponse)
async def get_parcel_related_plans(
    parcel_id: int,
    include_geometry: bool = Query(False),
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    return await get_parcel_context(parcel_id, include_geometry, limit, db)


@router.get("/parsel/{parcel_id}/summary", response_model=ParcelSummaryResponse)
async def get_parcel_summary(parcel_id: int, db: AsyncSession = Depends(get_db)):
    parcel = await get_parcel_or_none(db, parcel_id)
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    rows, _ = await get_related_plan_rows(db, parcel, limit=20, include_geometry=False)
    aski_count = sum(1 for row in rows if (row.get("status") or "").lower() == "aski")
    source = find_best_source(parcel.province, parcel.district, parcel.municipality)
    source_meta = build_source_metadata(source)
    warnings: list[str] = []
    if parcel.geom is None:
        warnings.append("Parsel geometrisi mevcut değil; harita ve PDF çizimi sınırlı olabilir.")
    if source_meta.source_status != "live":
        warnings.append("Kaynak güveni canlı sağlık geçmişinden değil registry/veritabanı metadatasından türetildi.")
    if not rows:
        warnings.append("İlişkili plan/askı kaydı bulunamadı; imar parametreleri kesin değildir.")
    eligibility = "eligible_with_warnings" if parcel.geom is not None else "limited"
    return ParcelSummaryResponse(
        parcel=parcel_identity(parcel),
        location={"il": parcel.province, "ilce": parcel.district, "mahalle": parcel.mahalle, "municipality": parcel.municipality},
        geometry_status="available" if parcel.geom is not None else "missing",
        source_trust=source_meta,
        related_plan_count=len(rows),
        related_aski_count=aski_count,
        report_eligibility=eligibility,
        warnings=warnings,
        generated_at=utc_now(),
    )
