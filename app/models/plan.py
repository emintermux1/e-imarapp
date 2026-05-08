from sqlalchemy import Column, Integer, String, ForeignKey, Date
from geoalchemy2 import Geometry
from app.models.base import Base

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"))
    plan_type = Column(String)
    status = Column(String)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    aski_start = Column(Date)
    aski_end = Column(Date)
    pdf_url = Column(String)
    gml_url = Column(String)
    
    # Add other relevant fields as needed