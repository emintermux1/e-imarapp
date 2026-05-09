from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.municipality import Municipality
from app.schemas.municipality import MunicipalityResponse, MunicipalityDiscoveryResponse, ImarStatusResponse
from app.services.netcad_keos_service import NetcadKeosService

router = APIRouter()

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
        async with NetcadKeosService() as service:
            discovery = await service.discover_municipality(slug)
        return discovery
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Discovery failed: {str(e)}")

@router.get("/municipalities/{slug}/imar-status", response_model=ImarStatusResponse)
async def get_imar_status(
    slug: str,
    ada: str = Query(...),
    parsel: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        async with NetcadKeosService() as service:
            status = await service.get_imar_status(slug, ada, parsel)
        return status
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Imar status fetch failed: {str(e)}")
