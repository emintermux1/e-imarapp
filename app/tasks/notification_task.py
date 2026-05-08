from celery import shared_task
from app.services.notification_service import NotificationService
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
        result = await db.execute(select(WatchlistItem))
        items = result.scalars().all()
    
    notifications_sent = 0
    for item in items:
        # Placeholder: real change detection would compare current vs stored state
        # For now, log that monitoring is active
        channels = item.notification_channels.split(",") if item.notification_channels else ["push"]
        logger.info("watchlist_checked", item_id=item.id, channels=channels)
    
    return {"status": "ok", "items_checked": len(items), "notifications_sent": notifications_sent}

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
        {"user_id": user_id, "notification_channels": item.notification_channels.split(",") if item.notification_channels else ["push"]},
        change_type,
        change_data
    )
    return {"status": "ok", "notifications": notifications}
