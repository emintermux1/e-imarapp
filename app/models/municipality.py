from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class Municipality(Base):
    __tablename__ = "municipalities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(index=True)
    province: Mapped[str | None] = mapped_column()
    district: Mapped[str | None] = mapped_column()
    slug: Mapped[str] = mapped_column(unique=True, index=True)
    keos_url: Mapped[str | None] = mapped_column()
    wms_url: Mapped[str | None] = mapped_column()
    wfs_url: Mapped[str | None] = mapped_column()
    ogc_capabilities_json: Mapped[str | None] = mapped_column()