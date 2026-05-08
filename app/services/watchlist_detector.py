from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.watchlist import WatchlistItem
from app.models.parcel import Parcel
from app.models.plan import Plan
from app.services.notification_service import NotificationService
from app.services.tkgm_service import TKGMService
from app.services.netcad_keos_service import NetcadKeosService
import structlog

logger = structlog.get_logger()

class WatchlistChangeDetector:
    """
    İzleme listesi değişiklik tespiti.
    Parsel tapu, imar planı, askı durumu, kamulaştırma değişikliklerini izler.
    """

    def __init__(self):
        self.notifier = NotificationService()

    async def check_all(self, db: AsyncSession) -> Dict:
        """
        Tüm watchlist item'ları kontrol et.
        """
        result = await db.execute(select(WatchlistItem))
        items = result.scalars().all()
        changes = []
        for item in items:
            item_changes = await self.check_item(item, db)
            if item_changes:
                changes.extend(item_changes)
                # Send notifications
                for change in item_changes:
                    await self._notify(item, change)
        logger.info("watchlist_check_complete", items_checked=len(items), changes_found=len(changes))
        return {"items_checked": len(items), "changes_found": len(changes), "changes": changes}

    async def check_item(self, item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """
        Tek bir watchlist item için değişiklik tespiti.
        """
        changes = []
        if item.parcel_id:
            changes.extend(await self._check_parcel_changes(item, db))
        if item.plan_id:
            changes.extend(await self._check_plan_changes(item, db))
        if item.geom_wkt:
            changes.extend(await self._check_area_changes(item, db))
        return changes

    async def _check_parcel_changes(self, item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """Parsel tapu durumu, imar durumu, şerh değişiklikleri."""
        result = await db.execute(
            select(Parcel).where(Parcel.id == item.parcel_id)
        )
        parcel = result.scalar_one_or_none()
        if not parcel:
            return []

        changes = []
        # Check if tapu status changed (simplified: compare with stored hash)
        # In production: compare with previous state snapshot
        if parcel.tapu_status and parcel.tapu_status != "temiz":
            changes.append({
                "type": "tapu_change",
                "parcel_id": item.parcel_id,
                "severity": "medium",
                "message": f"Parsel {parcel.ada}/{parcel.parsel} tapu durumu: {parcel.tapu_status}",
                "timestamp": None,
            })
        return changes

    async def _check_plan_changes(self, item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """Plan değişiklikleri — askı durumu, emsal/gabari değişimi."""
        result = await db.execute(
            select(Plan).where(Plan.id == item.plan_id)
        )
        plan = result.scalar_one_or_none()
        if not plan:
            return []

        changes = []
        if plan.status == "aski":
            changes.append({
                "type": "aski_plan",
                "plan_id": item.plan_id,
                "severity": "high",
                "message": f"Plan askıda — itiraz süresi kontrol edilmeli",
                "aski_end": plan.aski_end.isoformat() if plan.aski_end else None,
            })
        return changes

    async def _check_area_changes(self, item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """Bölge değişiklikleri — yeni plan, kamulaştırma, dönüşüm."""
        if not item.geom_wkt:
            return []
        changes = []
        # Check for new plans intersecting the watch area
        result = await db.execute(
            text("""
                SELECT id, plan_type, status, ST_AsGeoJSON(geom) as geom_json
                FROM plans
                WHERE ST_Intersects(geom, ST_GeomFromText(:wkt, 4326))
                AND status = 'aski'
            """),
            {"wkt": item.geom_wkt}
        )
        rows = result.mappings().all()
        for row in rows:
            changes.append({
                "type": "new_plan_aski",
                "plan_id": row["id"],
                "severity": "high",
                "message": f"İzlediğiniz bölgede yeni {row['plan_type']} planı askıya çıktı",
                "geom": row["geom_json"],
            })
        return changes

    async def _notify(self, item: WatchlistItem, change: Dict):
        """Değişiklik bildirimi gönder."""
        channels = item.notification_channels.split(",") if item.notification_channels else ["push"]
        title = f"eImarTR: {change['type']} tespit edildi"
        body = change.get("message", "İzlediğiniz parsel/planda değişiklik algılandı")
        await self.notifier.notify_watchlist_change(
            {"user_id": item.user_id, "notification_channels": channels},
            change["type"],
            change
        )
