from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry
from app.models.base import Base

class Parcel(Base):
    __tablename__ = "parcels"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    province: Mapped[str | None] = mapped_column(index=True)
    district: Mapped[str | None] = mapped_column(index=True)
    municipality: Mapped[str | None] = mapped_column(index=True)
    ada: Mapped[str] = mapped_column()
    parsel: Mapped[str] = mapped_column()
    geom = mapped_column(Geometry('MULTIPOLYGON', srid=4326))
    tapu_status: Mapped[str | None] = mapped_column()
    nitelik: Mapped[str | None] = mapped_column()
    alan_m2: Mapped[float | None] = mapped_column()
    mahalle: Mapped[str | None] = mapped_column()