from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func
from datetime import datetime
from app.models.base import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column()
    parcel_id: Mapped[int | None] = mapped_column()
    plan_id: Mapped[int | None] = mapped_column()
    pdf_path: Mapped[str | None] = mapped_column()
    status: Mapped[str | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())