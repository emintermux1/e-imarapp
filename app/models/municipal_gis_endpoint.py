from __future__ import annotations

from datetime import datetime, timedelta
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class MunicipalGISEndpoint(Base):
    __tablename__ = "municipal_gis_endpoints"
    __table_args__ = (UniqueConstraint("source_id", "base_url", name="municipal_gis_endpoints_source_base_url_key"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[str] = mapped_column(Text, ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    municipality_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("municipalities.id", ondelete="SET NULL"), nullable=True, index=True)
    base_url: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    wms_url: Mapped[str] = mapped_column(Text, nullable=False)
    wms_get_capabilities_url: Mapped[str] = mapped_column(Text, nullable=False)
    wms_version: Mapped[str | None] = mapped_column(Text, nullable=True)
    wfs_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    wfs_get_capabilities_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    available_layers: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)
    supported_srs: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    supported_formats: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="available", index=True)
    discovered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    refresh_after: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.utcnow() + timedelta(days=7)
    )
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
