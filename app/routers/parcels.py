from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.database import get_db
from app.services.tkgm_service import TKGMService
from app.schemas.parcel import ParcelResponse, ParcelSearchRequest, ParcelGeometryResponse

router = APIRouter()

@router.get("/parsel", response_model=ParcelResponse)
async def get_parcel(
    ada: str = Query(..., description="Ada numarası"),
    parsel: str = Query(..., description="Parsel numarası"),
    il: Optional[str] = Query(None, description="İl adı"),
    ilce: Optional[str] = Query(None, description="İlçe adı"),
    db: AsyncSession = Depends(get_db)
):
    try:
        async with TKGMService() as service:
            result = await service.get_parcel_data(ada, parsel, il, ilce)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TKGM service error: {str(e)}")

@router.get("/parsel/search", response_model=List[ParcelResponse])
async def search_parcels(
    query: str = Query(..., description="Arama sorgusu (adres, ada/parsel)"),
    il: Optional[str] = Query(None),
    ilce: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    try:
        async with TKGMService() as service:
            results = await service.search_by_address(query, il, ilce)
        return results[:limit]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Search error: {str(e)}")

@router.get("/parsel/geometry/{parcel_id}", response_model=ParcelGeometryResponse)
async def get_parcel_geometry(parcel_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT ada, parsel, ST_AsGeoJSON(geom) as geojson, ST_AsText(geom) as wkt FROM parcels WHERE id = :id"),
        {"id": parcel_id}
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
