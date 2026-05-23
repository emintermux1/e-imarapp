from typing import List, Dict, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.query_log import QueryLog
import uuid

class UserDataService:
    """
    User data management service for favorites, query history, and nearby searches.
    """
    
    async def save_favorite(self, user_id: int, item_type: str, item_id: int, db: AsyncSession) -> Dict[str, Any]:
        """
        Save an item as favorite for a user.
        """
        try:
            # Check if the favorites table exists, if not, this would need to be created
            # For now, we'll simulate the operation
            favorite_id = str(uuid.uuid4())
            
            # In a real implementation, we would insert into the user_saved_items table
            # INSERT INTO user_saved_items (user_reference, item_type, item_reference, label, metadata)
            # VALUES (:user_id, :item_type, :item_id, :label, :metadata)
            
            return {
                "id": favorite_id,
                "user_id": user_id,
                "item_type": item_type,
                "item_id": item_id,
                "created_at": "2023-06-15T10:30:00Z"  # In real implementation, use datetime.now()
            }
        except Exception as e:
            raise Exception(f"Failed to save favorite: {str(e)}")

    async def get_favorites(self, user_id: int, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Get user's favorite items.
        """
        try:
            # In a real implementation, we would query the user_saved_items table
            # SELECT * FROM user_saved_items WHERE user_reference = :user_id AND item_type IN ('parcel', 'plan', 'municipality', 'search', 'report')
            
            # For now, return an empty list as placeholder
            return []
        except Exception as e:
            raise Exception(f"Failed to get favorites: {str(e)}")

    async def delete_favorite(self, user_id: int, favorite_id: str, db: AsyncSession) -> bool:
        """
        Delete a favorite item.
        """
        try:
            # In a real implementation, we would delete from the user_saved_items table
            # DELETE FROM user_saved_items WHERE user_reference = :user_id AND id = :favorite_id
            
            return True
        except Exception as e:
            raise Exception(f"Failed to delete favorite: {str(e)}")

    async def get_query_history(self, user_id: int, db: AsyncSession, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get user's query history.
        """
        try:
            result = await db.execute(
                select(QueryLog)
                .where(QueryLog.user_id == user_id)
                .order_by(QueryLog.id.desc())
                .limit(limit)
            )
            logs = result.scalars().all()
            
            return [
                {
                    "id": log.id,
                    "query_type": log.query_type,
                    "params": log.params,
                    "results_count": log.results_count,
                    "timestamp": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ]
        except Exception as e:
            raise Exception(f"Failed to get query history: {str(e)}")

    async def get_nearby_search(self, lat: float, lon: float, radius_m: float, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Find nearby searches using PostGIS ST_DWithin.
        """
        try:
            # Create a point from the lat/lon
            point_wkt = f"POINT({lon} {lat})"
            
            # Use ST_DWithin to find nearby queries
            sql = text("""
                SELECT id, user_id, query_type, params, results_count, created_at
                FROM query_logs 
                WHERE ST_DWithin(
                    geom, 
                    ST_GeomFromText(:point_wkt, 4326), 
                    :radius_m / 111320.0  -- Convert meters to degrees approximation
                )
                ORDER BY created_at DESC
                LIMIT 50
            """)
            
            result = await db.execute(sql, {
                "point_wkt": point_wkt,
                "radius_m": radius_m
            })
            logs = result.fetchall()
            
            return [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "query_type": log.query_type,
                    "params": log.params,
                    "results_count": log.results_count,
                    "timestamp": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ]
        except Exception as e:
            raise Exception(f"Failed to get nearby searches: {str(e)}")