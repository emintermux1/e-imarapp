from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.municipal_gis_endpoint import MunicipalGISEndpoint
from app.models.municipality import Municipality
from app.schemas.municipality import (
    ImarStatusResponse,
    MunicipalGISEndpointResponse,
    MunicipalityDiscoveryResponse,
    MunicipalityResponse,
)
from app.services.netcad_keos_service import NetcadKeosService

router = APIRouter()


def _json_payload(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def _coerce_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc)


async def _data_source_exists(db: AsyncSession, source_id: str) -> bool:
    result = await db.execute(text("select 1 from data_sources where id = :source_id limit 1"), {"source_id": source_id})
    return result.first() is not None


def _response_from_discovery(municipality: Municipality, discovery: dict[str, Any]) -> dict[str, Any]:
    ogc = discovery.get("ogc") or {}
    if "wms_url" not in ogc:
        ogc["wms_url"] = discovery.get("wms_url") or municipality.wms_url
    if "wfs_url" not in ogc:
        ogc["wfs_url"] = discovery.get("wfs_url") or municipality.wfs_url
    if "base_url" not in ogc:
        ogc["base_url"] = discovery.get("base_url") or municipality.keos_url or municipality.wms_url or municipality.wfs_url
    if "discovered_at" not in ogc:
        ogc["discovered_at"] = discovery.get("discovered_at") or datetime.now(timezone.utc).isoformat()
    if "refresh_after" not in ogc:
        ogc["refresh_after"] = discovery.get("refresh_after")
    if "last_error" not in ogc:
        ogc["last_error"] = discovery.get("last_error")
    return {
        "slug": municipality.slug,
        "name": municipality.name,
        "tested_patterns": discovery.get("tested_patterns", 0),
        "live_endpoints": discovery.get("live_endpoints") or [],
        "keos_url": discovery.get("keos_url") or municipality.keos_url,
        "wms_url": discovery.get("wms_url") or municipality.wms_url,
        "wfs_url": discovery.get("wfs_url") or municipality.wfs_url,
        "discovered_at": discovery.get("discovered_at") or ogc.get("discovered_at") or datetime.now(timezone.utc).isoformat(),
        "refresh_after": discovery.get("refresh_after") or ogc.get("refresh_after"),
        "ogc": ogc,
    }


async def _persist_discovery(db: AsyncSession, municipality: Municipality, discovery: dict[str, Any]) -> MunicipalGISEndpoint | None:
    ogc = discovery.get("ogc") or {}
    now = datetime.now(timezone.utc)
    source_id = discovery.get("source_id")
    base_url = discovery.get("base_url") or municipality.keos_url or municipality.wms_url or municipality.wfs_url or municipality.slug
    if not source_id or not await _data_source_exists(db, source_id):
        municipality.keos_url = discovery.get("keos_url") or municipality.keos_url
        municipality.wms_url = discovery.get("wms_url") or municipality.wms_url
        municipality.wfs_url = discovery.get("wfs_url") or municipality.wfs_url
        municipality.ogc_capabilities_json = _json_payload(ogc or discovery)
        await db.flush()
        return None

    result = await db.execute(select(MunicipalGISEndpoint).where(MunicipalGISEndpoint.source_id == source_id, MunicipalGISEndpoint.base_url == base_url))
    endpoint = result.scalar_one_or_none()
    payload = {
        "source_id": source_id,
        "municipality_id": municipality.id,
        "base_url": discovery.get("base_url") or base_url,
        "wms_url": discovery.get("wms_url") or municipality.wms_url or "",
        "wms_get_capabilities_url": ogc.get("wms_get_capabilities_url") or discovery.get("wms_url") or municipality.wms_url or "",
        "wms_version": ogc.get("wms_version"),
        "wfs_url": discovery.get("wfs_url") or municipality.wfs_url,
        "wfs_get_capabilities_url": ogc.get("wfs_get_capabilities_url"),
        "available_layers": ogc.get("available_layers") or [],
        "supported_srs": ogc.get("supported_srs") or [],
        "supported_formats": ogc.get("supported_formats") or [],
        "status": ogc.get("status") or "available",
        "discovered_at": _coerce_datetime(ogc.get("discovered_at") or discovery.get("discovered_at") or now),
        "refresh_after": _coerce_datetime(ogc.get("refresh_after") or discovery.get("refresh_after") or (now + timedelta(days=7))),
        "last_error": ogc.get("last_error"),
        "metadata_json": ogc.get("metadata") or {},
    }
    if endpoint is None:
        endpoint = MunicipalGISEndpoint(**payload)
        db.add(endpoint)
    else:
        for key, value in payload.items():
            setattr(endpoint, key, value)
    municipality.keos_url = discovery.get("keos_url") or municipality.keos_url
    municipality.wms_url = discovery.get("wms_url") or municipality.wms_url
    municipality.wfs_url = discovery.get("wfs_url") or municipality.wfs_url
    municipality.ogc_capabilities_json = _json_payload(ogc or discovery)
    await db.flush()
    return endpoint


@router.get("/municipalities", response_model=list[MunicipalityResponse])
async def list_municipalities(
    province: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Municipality).offset(skip).limit(limit)
    if province:
        stmt = stmt.where(Municipality.province == province)
    if district:
        stmt = stmt.where(Municipality.district == district)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/municipalities/{slug}", response_model=MunicipalityResponse)
async def get_municipality(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Municipality).where(Municipality.slug == slug))
    municipality = result.scalar_one_or_none()
    if not municipality:
        raise HTTPException(status_code=404, detail="Municipality not found")
    return municipality


@router.post("/municipalities/{slug}/discover", response_model=MunicipalityDiscoveryResponse)
async def discover_municipality(slug: str, force: bool = Query(False), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Municipality).where(Municipality.slug == slug))
    municipality = result.scalar_one_or_none()
    if not municipality:
        raise HTTPException(status_code=404, detail="Municipality not found")

    if not force:
        cached = await db.execute(
            select(MunicipalGISEndpoint)
            .where(MunicipalGISEndpoint.municipality_id == municipality.id)
            .order_by(desc(MunicipalGISEndpoint.refresh_after), desc(MunicipalGISEndpoint.discovered_at))
        )
        endpoint = cached.scalars().first()
        if endpoint and endpoint.refresh_after and endpoint.refresh_after > datetime.now(timezone.utc):
            ogc = {
                "status": endpoint.status,
                "base_url": endpoint.base_url,
                "wms_url": endpoint.wms_url,
                "wms_get_capabilities_url": endpoint.wms_get_capabilities_url,
                "wms_version": endpoint.wms_version,
                "wfs_url": endpoint.wfs_url,
                "wfs_get_capabilities_url": endpoint.wfs_get_capabilities_url,
                "available_layers": endpoint.available_layers,
                "supported_srs": endpoint.supported_srs,
                "supported_formats": endpoint.supported_formats,
                "discovered_at": endpoint.discovered_at.isoformat() if endpoint.discovered_at else None,
                "refresh_after": endpoint.refresh_after.isoformat() if endpoint.refresh_after else None,
                "last_error": endpoint.last_error,
                "metadata": endpoint.metadata_json,
            }
            return _response_from_discovery(
                municipality,
                {
                    "tested_patterns": 0,
                    "live_endpoints": [{"type": "wms", "url": endpoint.wms_url, "status": endpoint.status}],
                    "keos_url": municipality.keos_url,
                    "wms_url": municipality.wms_url,
                    "wfs_url": municipality.wfs_url,
                    "discovered_at": endpoint.discovered_at.isoformat() if endpoint.discovered_at else datetime.now(timezone.utc).isoformat(),
                    "refresh_after": endpoint.refresh_after.isoformat() if endpoint.refresh_after else None,
                    "ogc": ogc,
                },
            )

    try:
        async with NetcadKeosService() as service:
            discovery = await service.discover_municipality(slug)
        await _persist_discovery(db, municipality, discovery)
        await db.commit()
        return _response_from_discovery(municipality, discovery)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Discovery failed: {exc}") from exc


@router.get("/municipalities/{slug}/gis-endpoints", response_model=list[MunicipalGISEndpointResponse])
async def list_municipal_gis_endpoints(slug: str, db: AsyncSession = Depends(get_db)):
    municipality_result = await db.execute(select(Municipality).where(Municipality.slug == slug))
    municipality = municipality_result.scalar_one_or_none()
    if not municipality:
        raise HTTPException(status_code=404, detail="Municipality not found")

    rows = await db.execute(
        select(MunicipalGISEndpoint)
        .where(MunicipalGISEndpoint.municipality_id == municipality.id)
        .order_by(desc(MunicipalGISEndpoint.discovered_at))
    )
    items = []
    for endpoint in rows.scalars().all():
        items.append(
            {
                "id": endpoint.id,
                "source_id": endpoint.source_id,
                "municipality_id": endpoint.municipality_id,
                "base_url": endpoint.base_url,
                "wms_url": endpoint.wms_url,
                "wms_get_capabilities_url": endpoint.wms_get_capabilities_url,
                "wms_version": endpoint.wms_version,
                "wfs_url": endpoint.wfs_url,
                "wfs_get_capabilities_url": endpoint.wfs_get_capabilities_url,
                "available_layers": [{**layer, **_layer_summary(layer)} for layer in endpoint.available_layers],
                "supported_srs": endpoint.supported_srs,
                "supported_formats": endpoint.supported_formats,
                "status": endpoint.status,
                "discovered_at": endpoint.discovered_at,
                "refresh_after": endpoint.refresh_after,
                "last_error": endpoint.last_error,
                "metadata": endpoint.metadata_json,
                "created_at": endpoint.created_at,
                "updated_at": endpoint.updated_at,
            }
        )
    return items


@router.post("/municipalities/{slug}/gis-endpoints/refresh", response_model=MunicipalityDiscoveryResponse)
async def refresh_municipal_gis_endpoints(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Municipality).where(Municipality.slug == slug))
    municipality = result.scalar_one_or_none()
    if not municipality:
        raise HTTPException(status_code=404, detail="Municipality not found")
    try:
        async with NetcadKeosService() as service:
            discovery = await service.discover_municipality(slug)
        await _persist_discovery(db, municipality, discovery)
        await db.commit()
        return _response_from_discovery(municipality, discovery)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Discovery failed: {exc}") from exc


@router.get("/municipalities/{slug}/imar-status", response_model=ImarStatusResponse)
async def get_imar_status(slug: str, ada: str = Query(...), parsel: str = Query(...), db: AsyncSession = Depends(get_db)):
    try:
        async with NetcadKeosService() as service:
            status = await service.get_imar_status(slug, ada, parsel)
        return status
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Imar status fetch failed: {exc}") from exc
