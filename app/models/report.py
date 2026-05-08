from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.models.base import Base
from datetime import datetime

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    parcel_id = Column(Integer, ForeignKey("parcels.id"), nullable=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    pdf_path = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)