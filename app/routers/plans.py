from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.services.eplan_service import EPlanService

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@router.get("/plans")
async def get_plans(
    municipality_id: int = None,
    plan_type: str = None,
    db: AsyncSession = Depends(get_db)
):
    service = EPlanService()
    return await service.get_plans(municipality_id, plan_type)

@router.get("/plans/aski")
async def get_aski_plans(
    db: AsyncSession = Depends(get_db)
):
    service = EPlanService()
    return await service.get_aski_plans()
