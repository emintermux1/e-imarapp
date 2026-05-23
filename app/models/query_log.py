from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from app.models.base import Base

class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column()
    query_type: Mapped[str | None] = mapped_column()
    params: Mapped[str | None] = mapped_column()  # JSON string
    results_count: Mapped[int | None] = mapped_column()
    geom = mapped_column(Geometry('POINT', srid=4326))