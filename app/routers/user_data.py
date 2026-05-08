from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.user_data_service import UserDataService

router = APIRouter()

@router.post("/favorites")
async def save_favorite(
    item_type: str,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Save an item as favorite."""
    service = UserDataService()
    try:
        # TODO: Get user_id from auth
        user_id = 1
        result = await service.save_favorite(user_id, item_type, item_id, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/favorites")
async def get_favorites(db: AsyncSession = Depends(get_db)):
    """Get user's favorite items."""
    service = UserDataService()
    try:
        # TODO: Get user_id from auth
        user_id = 1
        result = await service.get_favorites(user_id, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a favorite item."""
    service = UserDataService()
    try:
        # TODO: Get user_id from auth
        user_id = 1
        result = await service.delete_favorite(user_id, favorite_id, db)
        if result:
            return {"deleted": True}
        else:
            raise HTTPException(status_code=404, detail="Favorite not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_query_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get user's query history."""
    service = UserDataService()
    try:
        # TODO: Get user_id from auth
        user_id = 1
        result = await service.get_query_history(user_id, db, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nearby")
async def get_nearby_search(
    lat: float,
    lon: float,
    radius_m: float = 1000,
    db: AsyncSession = Depends(get_db)
):
    """Find nearby searches."""
    service = UserDataService()
    try:
        result = await service.get_nearby_search(lat, lon, radius_m, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))