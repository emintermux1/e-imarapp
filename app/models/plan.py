from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from datetime import date
from app.models.base import Base

class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    municipality_id: Mapped[int | None] = mapped_column()
    plan_type: Mapped[str | None] = mapped_column()
    status: Mapped[str | None] = mapped_column()
    geom = mapped_column(Geometry('MULTIPOLYGON', srid=4326))
    aski_start: Mapped[date | None] = mapped_column()
    aski_end: Mapped[date | None] = mapped_column()
    pdf_url: Mapped[str | None] = mapped_column()
    gml_url: Mapped[str | None] = mapped_column()