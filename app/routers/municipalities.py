from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.services.tucbs_service import TUCBSService

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@router.get("/municipalities")
async def get_municipalities(
    db: AsyncSession = Depends(get_db)
):
    try:
        service = TUCBSService()
        result = await service.get_municipalities()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/municipalities/{municipality_id}/discover")
async def discover_municipality(
    municipality_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        service = TUCBSService()
        result = await service.discover_municipality(municipality_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))