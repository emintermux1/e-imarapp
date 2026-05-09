from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.sources.registry import sources_by_capability
from app.core.responses import envelope

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
    layers = []
    if sources_by_capability("parcel-query"):
        layers.append({"id": "parcels", "name": "Parseller", "type": "vector", "mode": "registry"})
    if sources_by_capability("aski-list"):
        layers.append({"id": "aski-overlay", "name": "Askıdaki Planlar", "type": "vector", "mode": "registry"})
    if sources_by_capability("layers"):
        layers.append({"id": "source-layers", "name": "Keşfedilen Katmanlar", "type": "catalog", "mode": "registry"})
    return envelope("ok", mode="registry", layers=layers, total=len(layers))
