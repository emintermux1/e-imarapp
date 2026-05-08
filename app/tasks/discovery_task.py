from celery import shared_task
import asyncio

from app.database import AsyncSessionLocal
from app.models.municipality import Municipality
from app.services.keos_discovery import KeosDiscoveryService
from sqlalchemy import select
import structlog

logger = structlog.get_logger()

@shared_task
def discover_municipality_task(municipality_id: int):
    """
    Celery task: Discover KEOS/WMS/WFS endpoints for a single municipality.
    """
    async def _run() -> dict:
        async with AsyncSessionLocal() as db:
            service = KeosDiscoveryService()
            try:
                result = await service.discover_keos_endpoints(db, municipality_id)
                logger.info(
                    "municipality_discovered",
                    municipality_id=municipality_id,
                    status=result.get("status"),
                    wms_url=result.get("wms_url"),
                )
                return {"status": "ok", "municipality_id": municipality_id, "result": result}
            finally:
                await service.close()
    try:
        return asyncio.run(_run())
    except Exception as e:  # pylint: disable=broad-except
        logger.error("municipality_discovery_failed", municipality_id=municipality_id, error=str(e))
        return {"status": "error", "municipality_id": municipality_id, "error": str(e)}

@shared_task
def batch_discover_municipalities(province: str = None, limit: int = 100):
    """
    Celery task: Batch discovery for municipalities.
    """
    async def _run() -> list[int]:
        async with AsyncSessionLocal() as db:
            stmt = select(Municipality.id).limit(limit)
            if province:
                stmt = stmt.where(Municipality.province == province)
            result = await db.execute(stmt)
            return [row[0] for row in result.all()]

    municipality_ids = asyncio.run(_run())
    for municipality_id in municipality_ids:
        discover_municipality_task.delay(municipality_id)
    return {"status": "queued", "count": len(municipality_ids), "province": province}
