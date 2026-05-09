from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.database import get_db
from app.schemas.parcel import ParcelResponse, ParcelSearchRequest, ParcelGeometryResponse
from app.services.netcad_keos_service import NetcadKeosService
from app.services.tkgm_service import TKGMService
from app.sources.registry import get_source

router = APIRouter()


@router.get("/parsel")
async def get_parcel(
    ada: str,
    parsel: str,
    il: Optional[str] = None,
    ilce: Optional[str] = None,
    source_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if source_id:
        src = get_source(source_id)
        if not src:
            raise HTTPException(status_code=404, detail="source_id bulunamadı.")
        if src.id.startswith("bel."):
            return await NetcadKeosService().discover_source(src)
    async with TKGMService() as service:
        return await service.get_parcel_data(ada, parsel, il, ilce)


@router.get("/parsel/search")
async def search_parcels(
    query: str = Query(..., description="Arama sorgusu (adres, ada/parsel)"),
    il: Optional[str] = Query(None),
    ilce: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    async with TKGMService() as service:
        results = await service.search_by_address(query, il, ilce)
    return results[:limit]


@router.get("/parsel/geometry/{parcel_id}", response_model=ParcelGeometryResponse)
async def get_parcel_geometry(parcel_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT ada, parsel, ST_AsGeoJSON(geom) as geojson, ST_AsText(geom) as wkt FROM parcels WHERE id = :id"),
        {"id": parcel_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return {
        "parcel_id": parcel_id,
        "ada": row["ada"],
        "parsel": row["parsel"],
        "geojson": row["geojson"],
        "wkt": row["wkt"],
    }
