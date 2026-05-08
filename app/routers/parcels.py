from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.services.tkgm_service import TKGMService

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
    db: AsyncSession = Depends(get_db)
):
    try:
        service = TKGMService()
        result = await service.get_parcel_data(ada, parsel, il, ilce)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))