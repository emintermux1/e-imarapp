from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from app.models.base import Base

class WatchlistItem(Base):
    __tablename__ = "watchlist"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    geom = Column(String, nullable=True)  # Store as WKT string
    notification_channels = Column(JSON)  # Store as JSON array
    
    # Add constraint to ensure one of parcel_id, plan_id, or geom is set