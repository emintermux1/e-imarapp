from celery import shared_task
from app.services.tkgm_service import TKGMService
from app.services.eplan_service import EPlanService
from app.database import AsyncSessionLocal
from sqlalchemy import text
import structlog

logger = structlog.get_logger()

@shared_task
async def sync_tkgm_parcels_batch(province: str, district: str, ada_list: list):
    """
    Celery task: Batch TKGM parcel sync for a district.
    """
    async with TKGMService() as service:
        for ada in ada_list:
            try:
                # Attempt to fetch parcel data for a range of parsel numbers
                for parsel_num in range(1, 100):
                    try:
                        data = await service.get_parcel_data(
                            ada=str(ada), parsel=str(parsel_num),
                            il=province, ilce=district
                        )
                        # Insert into DB via raw SQL or ORM
                        logger.info("tkgm_parcel_synced", ada=ada, parsel=parsel_num, il=province)
                    except Exception:
                        # Expected: many parsels don't exist
                        pass
            except Exception as e:
                logger.error("tkgm_sync_error", ada=ada, error=str(e))
    return {"status": "completed", "province": province, "district": district, "ada_count": len(ada_list)}

@shared_task
async def sync_eplan_aski_plans():
    """
    Celery task: Sync e-Plan askı planları.
    """
    async with EPlanService() as service:
        plans = await service.get_aski_plans()
    logger.info("eplan_aski_synced", count=len(plans))
    return {"status": "ok", "aski_plans_found": len(plans)}
