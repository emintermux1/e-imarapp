from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models.watchlist import WatchlistItem
from app.schemas.watchlist import WatchlistItemRequest, WatchlistItemResponse

router = APIRouter()

@router.post("/watchlist", response_model=WatchlistItemResponse)
async def create_watchlist_item(
    req: WatchlistItemRequest,
    db: AsyncSession = Depends(get_db)
):
    item = WatchlistItem(
        user_id=1,  # TODO: get from auth
        parcel_id=req.parcel_id,
        plan_id=req.plan_id,
        geom_wkt=req.geom_wkt,
        notification_channels=",".join(req.notification_channels),
        label=req.label,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("/watchlist", response_model=list[WatchlistItemResponse])
async def list_watchlist_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.user_id == 1)  # TODO: from auth
    )
    return result.scalars().all()

@router.delete("/watchlist/{item_id}")
async def delete_watchlist_item(item_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(
        delete(WatchlistItem).where(WatchlistItem.id == item_id, WatchlistItem.user_id == 1)
    )
    await db.commit()
    return {"deleted": True}
