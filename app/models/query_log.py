from sqlalchemy import Column, Integer, String, ForeignKey, Integer
from geoalchemy2 import Geometry
from app.models.base import Base

class QueryLog(Base):
    __tablename__ = "query_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query_type = Column(String)
    params = Column(String)  # Store as JSON string
    results_count = Column(Integer)
    geom = Column(Geometry('POINT', srid=4326))  # Store the query location if applicable