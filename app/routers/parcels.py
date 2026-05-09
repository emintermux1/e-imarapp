from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.services.tkgm_service import TKGMService
from app.services.netcad_keos_service import NetcadKeosService
from app.core.responses import envelope
from app.sources.registry import get_source

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@router.get("/parsel")
async def get_parcel(
    ada: str,
    parsel: str,
    il: str = None,
    ilce: str = None,
    source_id: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    if source_id:
        src = get_source(source_id)
        if not src:
            return envelope("invalid_input", message="source_id bulunamadı.")
        if src.id.startswith("bel."):
            service = NetcadKeosService()
            return await service.discover_source(src)
    service = TKGMService()
    return await service.get_parcel_data(ada, parsel, il, ilce)
