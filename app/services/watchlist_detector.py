from typing import List, Dict, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.watchlist import WatchlistItem
from app.models.parcel import Parcel
from app.models.plan import Plan
import structlog

logger = structlog.get_logger()

class WatchlistChangeDetector:
    """
    Kullanıcının izleme listesindeki parsel/planlar için değişiklik tespiti.
    Periyodik Celery task ile çalışır.
    """
    
    async def check_all_watchlists(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Tüm watchlist item'ları çek ve değişiklikleri kontrol et.
        Değişiklik varsa notification gönder.
        """
        try:
            result = await db.execute(select(WatchlistItem))
            items = result.scalars().all()
            
            changes_detected = 0
            notifications_sent = 0
            
            for item in items:
                changes = await self._check_item_changes(item, db)
                if changes:
                    changes_detected += 1
                    # Send notification for each change
                    for change in changes:
                        # This would typically trigger a Celery task
                        # For now, we'll just log it
                        logger.info("watchlist_change_detected", 
                                  item_id=item.id, 
                                  change_type=change["type"],
                                  change_data=change["data"])
                        notifications_sent += 1
            
            return {
                "status": "completed",
                "items_checked": len(items),
                "changes_detected": changes_detected,
                "notifications_sent": notifications_sent
            }
        except Exception as e:
            logger.error("watchlist_check_failed", error=str(e))
            return {
                "status": "error",
                "error": str(e)
            }

    async def _check_item_changes(self, watchlist_item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """Check for changes in a specific watchlist item."""
        changes = []
        
        if watchlist_item.parcel_id:
            parcel_changes = await self.check_parcel_changes(watchlist_item, db)
            changes.extend(parcel_changes)
            
        if watchlist_item.plan_id:
            plan_changes = await self.check_plan_changes(watchlist_item, db)
            changes.extend(plan_changes)
            
        if watchlist_item.geom_wkt:
            area_changes = await self.check_area_changes(watchlist_item, db)
            changes.extend(area_changes)
            
        return changes

    async def check_parcel_changes(self, watchlist_item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """
        Parsel değişiklikleri:
        - Tapu durumu değişimi
        - İmar planı değişimi
        - Şerh/kamulaştırma
        - Dönüşüm projesi dahil edilmesi
        """
        if not watchlist_item.parcel_id:
            return []
            
        try:
            result = await db.execute(
                select(Parcel).where(Parcel.id == watchlist_item.parcel_id)
            )
            parcel = result.scalar_one_or_none()
            
            if not parcel:
                return []
                
            # In a real implementation, we would compare with stored previous state
            # For now, we'll simulate some changes for demonstration
            changes = []
            
            # Check for tapu status changes (simulated)
            if parcel.attributes and parcel.attributes.get('tapu_durumu'):
                # This is where we would compare with previous state
                # For now, we'll just log that we're checking
                changes.append({
                    "type": "tapu_change",
                    "data": {
                        "parcel_id": str(parcel.id),
                        "current_status": parcel.attributes.get('tapu_durumu'),
                        "message": "Tapu durumu değişikliği kontrol edildi"
                    }
                })
            
            # Check for imar plan changes (simulated)
            if parcel.attributes and parcel.attributes.get('imar_plan_id'):
                changes.append({
                    "type": "imar_change",
                    "data": {
                        "parcel_id": str(parcel.id),
                        "plan_id": parcel.attributes.get('imar_plan_id'),
                        "message": "İmar planı değişikliği kontrol edildi"
                    }
                })
                
            # Check for serh/kamulaştırma (simulated)
            if parcel.attributes and parcel.attributes.get('serh_durumu'):
                changes.append({
                    "type": "serh",
                    "data": {
                        "parcel_id": str(parcel.id),
                        "serh_status": parcel.attributes.get('serh_durumu'),
                        "message": "Şerh durumu kontrol edildi"
                    }
                })
                
            # Check for transformation project (simulated)
            if parcel.attributes and parcel.attributes.get('donusum_projesi'):
                changes.append({
                    "type": "donusum",
                    "data": {
                        "parcel_id": str(parcel.id),
                        "project": parcel.attributes.get('donusum_projesi'),
                        "message": "Dönüşüm projesi değişikliği kontrol edildi"
                    }
                })
                
            return changes
        except Exception as e:
            logger.error("parcel_change_check_failed", 
                        item_id=watchlist_item.id, 
                        parcel_id=watchlist_item.parcel_id, 
                        error=str(e))
            return []

    async def check_plan_changes(self, watchlist_item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """
        Plan değişiklikleri:
        - Askı durumu değişimi (aski → yürürlükte / askı reddedildi)
        - Plan değişikliği (emsal, gabari değişimi)
        - Yeni plan askıya çıktı
        """
        if not watchlist_item.plan_id:
            return []
            
        try:
            result = await db.execute(
                select(Plan).where(Plan.id == watchlist_item.plan_id)
            )
            plan = result.scalar_one_or_none()
            
            if not plan:
                return []
                
            # In a real implementation, we would compare with stored previous state
            # For now, we'll simulate some changes for demonstration
            changes = []
            
            # Check for askı status changes (simulated)
            if plan.metadata_ and plan.metadata_.get('aski_durumu'):
                changes.append({
                    "type": "aski_plan",
                    "data": {
                        "plan_id": str(plan.id),
                        "current_status": plan.metadata_.get('aski_durumu'),
                        "message": "Askı durumu değişikliği kontrol edildi"
                    }
                })
            
            # Check for plan changes (simulated)
            if plan.metadata_ and plan.metadata_.get('plan_degisiklikleri'):
                changes.append({
                    "type": "plan_change",
                    "data": {
                        "plan_id": str(plan.id),
                        "changes": plan.metadata_.get('plan_degisiklikleri'),
                        "message": "Plan değişiklikleri kontrol edildi"
                    }
                })
                
            # Check for new plan announcement (simulated)
            if plan.metadata_ and plan.metadata_.get('yeni_aski'):
                changes.append({
                    "type": "yeni_aski",
                    "data": {
                        "plan_id": str(plan.id),
                        "announcement": plan.metadata_.get('yeni_aski'),
                        "message": "Yeni plan askıya çıktı"
                    }
                })
                
            return changes
        except Exception as e:
            logger.error("plan_change_check_failed", 
                        item_id=watchlist_item.id, 
                        plan_id=watchlist_item.plan_id, 
                        error=str(e))
            return []

    async def check_area_changes(self, watchlist_item: WatchlistItem, db: AsyncSession) -> List[Dict]:
        """
        Bölge değişiklikleri:
        - Yeni imar planı askıya çıktı (geom intersect)
        - Kamulaştırma ilanı
        - Dönüşüm projesi ilanı
        """
        if not watchlist_item.geom_wkt:
            return []
            
        try:
            # Use PostGIS ST_Intersects to find intersecting plans
            sql = text("""
                SELECT id, plan_number, title, metadata
                FROM plans 
                WHERE ST_Intersects(geom, ST_GeomFromText(:wkt, 4326))
                AND created_at > NOW() - INTERVAL '30 days'
            """)
            
            result = await db.execute(sql, {"wkt": watchlist_item.geom_wkt})
            intersecting_plans = result.fetchall()
            
            changes = []
            
            for plan in intersecting_plans:
                changes.append({
                    "type": "bolge_yeni_plan",
                    "data": {
                        "plan_id": str(plan.id),
                        "plan_number": plan.plan_number,
                        "title": plan.title,
                        "message": "Bölgenizde yeni imar planı askıya çıktı"
                    }
                })
            
            # Check for kamulaştırma (simulated)
            # In a real implementation, we would check against kamulaştırma tables
            changes.append({
                "type": "kamulastirma",
                "data": {
                    "area": watchlist_item.geom_wkt,
                    "message": "Bölge kamulaştırma kontrolü yapıldı"
                }
            })
            
            # Check for dönüşüm projesi (simulated)
            # In a real implementation, we would check against transformation project tables
            changes.append({
                "type": "donusum_ilani",
                "data": {
                    "area": watchlist_item.geom_wkt,
                    "message": "Bölge dönüşüm projesi kontrolü yapıldı"
                }
            })
                
            return changes
        except Exception as e:
            logger.error("area_change_check_failed", 
                        item_id=watchlist_item.id, 
                        error=str(e))
            return []