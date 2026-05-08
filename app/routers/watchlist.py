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

@router.get("/watchlist/activity")
async def get_watchlist_activity(db: AsyncSession = Depends(get_db)):
    """Get watchlist activity log."""
    # In a real implementation, this would query an activity log table
    # For now, we'll return a placeholder response
    return {
        "activity": [
            {
                "id": 1,
                "item_id": 1,
                "event_type": "change_detected",
                "description": "İmar planı değişikliği tespit edildi",
                "timestamp": "2023-06-15T10:30:00Z"
            },
            {
                "id": 2,
                "item_id": 2,
                "event_type": "notification_sent",
                "description": "Push bildirimi gönderildi",
                "timestamp": "2023-06-15T10:31:00Z"
            }
        ]
    }

@router.get("/watchlist/alerts")
async def get_active_alerts(db: AsyncSession = Depends(get_db)):
    """Get active alerts for the user's watchlist."""
    # In a real implementation, this would query an alerts table
    # For now, we'll return a placeholder response
    return {
        "alerts": [
            {
                "id": 1,
                "item_id": 1,
                "type": "imar_change",
                "title": "İmar Planı Değişikliği",
                "description": "İzlediğiniz parselin imar planı değişti",
                "severity": "high",
                "timestamp": "2023-06-15T10:30:00Z",
                "is_read": False
            }
        ]
    }

@router.post("/watchlist/{item_id}/silence")
async def silence_watchlist_alert(item_id: int, db: AsyncSession = Depends(get_db)):
    """Silence alerts for a specific watchlist item."""
    # In a real implementation, this would update an alerts table
    # For now, we'll just return a success response
    return {"silenced": True, "item_id": item_id, "message": "Alerts silenced successfully"}