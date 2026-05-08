from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class WatchlistItem(Base):
    __tablename__ = "watchlist"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column()
    parcel_id: Mapped[int | None] = mapped_column()
    plan_id: Mapped[int | None] = mapped_column()
    geom_wkt: Mapped[str | None] = mapped_column()  # Store as WKT string
    notification_channels: Mapped[str | None] = mapped_column()  # JSON string
    label: Mapped[str | None] = mapped_column()  # User-defined label