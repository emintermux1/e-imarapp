from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.municipality import Municipality
from app.schemas.municipality import MunicipalityResponse, MunicipalityDiscoveryResponse, ImarStatusResponse
from app.services.netcad_keos_service import NetcadKeosService
from app.services.keos_discovery import KeosDiscoveryService
from app.config import settings

router = APIRouter()


def require_admin_key(x_admin_key: str | None = Header(default=None)) -> None:
    configured_key = settings.ADMIN_DISCOVERY_KEY
    if not configured_key or x_admin_key != configured_key:
        raise HTTPException(status_code=403, detail="Admin authorization required")

@router.get("/municipalities", response_model=List[MunicipalityResponse])
async def list_municipalities(
    province: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
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
    result = await db.execute(
        select(Municipality).where(Municipality.slug == slug)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Municipality not found")
    return m

@router.post("/municipalities/{slug}/discover", response_model=MunicipalityDiscoveryResponse)
async def discover_municipality(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Municipality).where(Municipality.slug == slug)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Municipality not found")
    try:
        service = KeosDiscoveryService()
        try:
            return await service.discover_keos_endpoints(db, m.id)
        finally:
            await service.close()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discovery failed: {str(e)}")


@router.post("/admin/discover-all-municipalities")
async def discover_all_municipalities(
    limit: int = Query(500, ge=1, le=5000),
    _: None = Depends(require_admin_key),
    db: AsyncSession = Depends(get_db),
):
    service = KeosDiscoveryService()
    try:
        return await service.discover_all(db, limit=limit)
    finally:
        await service.close()

@router.get("/municipalities/{slug}/imar-status", response_model=ImarStatusResponse)
async def get_imar_status(
    slug: str,
    ada: str = Query(...),
    parsel: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        status = await NetcadKeosService().get_imar_status(slug, ada, parsel)
        return status
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Imar status fetch failed: {str(e)}")
