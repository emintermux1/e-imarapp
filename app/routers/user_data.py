from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, desc
from typing import Optional, List
from app.database import get_db
from app.models.query_log import QueryLog

router = APIRouter()

@router.post("/favorites")
async def save_favorite(
    item_type: str = Query(..., enum=["parcel", "plan", "municipality"]),
    item_id: int = Query(...),
    label: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Kullanıcı favori kaydet."""
    # Simplified — full favorites table not yet modeled
    # Store in query_log for now
    log = QueryLog(
        user_id=1,  # TODO: from auth
        query_type=f"favorite_{item_type}",
        params=f"{{\"item_id\": {item_id}, \"label\": \"{label or ''}\"}}",
        results_count=1,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return {"status": "saved", "item_type": item_type, "item_id": item_id, "label": label}

@router.get("/favorites")
async def list_favorites(
    item_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Kullanıcı favorileri listele."""
    qtype = f"favorite_{item_type}" if item_type else None
    stmt = select(QueryLog).where(QueryLog.query_type.like("favorite_%")).order_by(desc(QueryLog.id)).limit(limit)
    if qtype:
        stmt = stmt.where(QueryLog.query_type == qtype)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {
        "items": [{"id": i.id, "type": i.query_type.replace("favorite_", ""), "params": i.params, "created_at": i.id} for i in items],
        "total": len(items)
    }

@router.get("/history")
async def get_query_history(
    limit: int = Query(50, ge=1, le=500),
    query_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Geçmiş sorgular."""
    stmt = select(QueryLog).where(QueryLog.query_type.notlike("favorite_%")).order_by(desc(QueryLog.id)).limit(limit)
    if query_type:
        stmt = stmt.where(QueryLog.query_type == query_type)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {
        "items": [{"id": i.id, "type": i.query_type, "params": i.params, "results": i.results_count} for i in items],
        "total": len(items)
    }

@router.get("/nearby")
async def nearby_search(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_m: float = Query(1000, ge=10, le=50000),
    db: AsyncSession = Depends(get_db)
):
    """
    Yakınımda ara — PostGIS ST_DWithin ile.
    """
    try:
        result = await db.execute(
            text("""
                SELECT id, ada, parsel, province, district, municipality,
                       ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) as distance_m
                FROM parcels
                WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)
                ORDER BY distance_m
                LIMIT 50
            """),
            {"lat": lat, "lon": lon, "radius": radius_m}
        )
        rows = result.mappings().all()
        return {
            "center": {"lat": lat, "lon": lon},
            "radius_m": radius_m,
            "results": [
                {
                    "id": r["id"],
                    "ada": r["ada"],
                    "parsel": r["parsel"],
                    "province": r["province"],
                    "district": r["district"],
                    "municipality": r["municipality"],
                    "distance_m": round(r["distance_m"], 1)
                }
                for r in rows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))