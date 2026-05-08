from celery import shared_task
from app.services.notification_service import NotificationService
from app.services.watchlist_detector import WatchlistChangeDetector
from app.database import AsyncSessionLocal
from app.models.watchlist import WatchlistItem
from sqlalchemy import select
import structlog
import json

logger = structlog.get_logger()

@shared_task
async def check_watchlist_changes():
    """
    Celery beat task: Periodically check all watchlist items for changes
    and send notifications if detected.
    """
    async with AsyncSessionLocal() as db:
        detector = WatchlistChangeDetector()
        result = await detector.check_all_watchlists(db)
        
    logger.info("watchlist_check_completed", result=result)
    return result

@shared_task
async def send_watchlist_notification(user_id: int, item_id: int, change_type: str, change_data: dict):
    """
    Celery task: Send notification for a specific watchlist change.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(WatchlistItem).where(WatchlistItem.id == item_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            return {"status": "error", "reason": "Watchlist item not found"}
    
    service = NotificationService()
    notifications = await service.notify_watchlist_change(
        {
            "user_id": user_id, 
            "notification_channels": item.notification_channels.split(",") if item.notification_channels else ["push"],
            "user_email": getattr(item, 'user_email', None),  # If email is stored
            "user_phone": getattr(item, 'user_phone', None)   # If phone is stored
        },
        change_type,
        change_data
    )
    return {"status": "ok", "notifications": notifications}