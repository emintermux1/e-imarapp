from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MunicipalGisEndpoint(Base):
    __tablename__ = "municipal_gis_endpoints"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    belediye_id: Mapped[int] = mapped_column(ForeignKey("municipalities.id"), index=True)
    base_url: Mapped[str] = mapped_column(index=True)
    wms_url: Mapped[str | None] = mapped_column(nullable=True)
    wfs_url: Mapped[str | None] = mapped_column(nullable=True)
    discovered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    available_layers: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    supported_srs: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(default="pending", index=True)
