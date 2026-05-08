from sqlalchemy import Column, Integer, String
from app.models.base import Base

class Municipality(Base):
    __tablename__ = "municipalities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    province = Column(String)
    district = Column(String)
    slug = Column(String, unique=True)
    keos_url = Column(String)
    wms_url = Column(String)
    wfs_url = Column(String)
    ogc_capabilities_json = Column(String)  # Store as JSON string
    
    # Add other relevant fields as needed