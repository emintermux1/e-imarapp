from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@router.get("/layers")
async def get_map_layers(
    db: AsyncSession = Depends(get_db)
):
    try:
        # Implementation for getting available map layers
        # This would typically query the database for available layers
        # or call external services to discover layers
        layers = [
            {"id": "parcels", "name": "Parsels", "type": "vector"},
            {"id": "plans", "name": "Plans", "type": "vector"},
            {"id": "municipalities", "name": "Municipalities", "type": "vector"}
        ]
        return layers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))