from sqlalchemy import String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import EventStatus


class Event(BaseModel):
    __tablename__ = "events"
    
    cafe_id: Mapped[str] = mapped_column(String(36), ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    location: Mapped[str] = mapped_column(String(500), nullable=False)
    event_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(SQLEnum(EventStatus), nullable=False, default=EventStatus.DRAFT)
