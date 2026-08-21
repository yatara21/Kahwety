from sqlalchemy import String, ForeignKey, DateTime, Boolean, Enum as SQLEnum, Float, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import CafeRegistrationStatus


class Cafe(BaseModel):
    __tablename__ = "cafes"
    
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    approved_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    place_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registration_status: Mapped[str] = mapped_column(SQLEnum(CafeRegistrationStatus), nullable=False, default=CafeRegistrationStatus.PENDING, index=True)
    registration_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    working_hours: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
