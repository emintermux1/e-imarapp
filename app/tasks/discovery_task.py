from celery import shared_task
from app.services.netcad_keos_service import NetcadKeosService
from app.database import AsyncSessionLocal
from app.models.municipality import Municipality
from sqlalchemy import select
import asyncio
import structlog

logger = structlog.get_logger()

@shared_task
async def discover_municipality_task(slug: str):
    """
    Celery task: Discover KEOS/WMS/WFS endpoints for a single municipality.
    """
    try:
        async with NetcadKeosService() as service:
            result = await service.discover_municipality(slug)
        
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Municipality).where(Municipality.slug == slug))
            m = res.scalar_one_or_none()
            if m:
                m.keos_url = result.get("keos_url")
                m.wms_url = result.get("wms_url")
                m.wfs_url = result.get("wfs_url")
                await db.commit()
        
        logger.info("municipality_discovered", slug=slug, endpoints_found=len(result.get("live_endpoints", [])))
        return {"status": "ok", "slug": slug, "live_endpoints": len(result.get("live_endpoints", []))}
    except Exception as e:
        logger.error("municipality_discovery_failed", slug=slug, error=str(e))
        return {"status": "error", "slug": slug, "error": str(e)}

@shared_task
async def batch_discover_municipalities(province: str = None, limit: int = 100):
    """
    Celery task: Batch discovery for municipalities.
    """
    async with AsyncSessionLocal() as db:
        stmt = select(Municipality).limit(limit)
        if province:
            stmt = stmt.where(Municipality.province == province)
        result = await db.execute(stmt)
        municipalities = result.scalars().all()
    
    tasks = [discover_municipality_task.delay(m.slug) for m in municipalities]
    return {"status": "queued", "count": len(municipalities), "province": province}
