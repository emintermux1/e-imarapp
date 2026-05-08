from sqlalchemy import Column, Integer, String, ForeignKey
from geoalchemy2 import Geometry
from app.models.base import Base

class Parcel(Base):
    __tablename__ = "parcels"
    
    id = Column(Integer, primary_key=True, index=True)
    province = Column(String, index=True)
    district = Column(String, index=True)
    municipality = Column(String, index=True)
    ada = Column(String)
    parsel = Column(String)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    tapu_status = Column(String)
    
    # Add other relevant fields as needed