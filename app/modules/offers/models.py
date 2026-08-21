from sqlalchemy import String, ForeignKey, DateTime, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import OfferStatus


class Offer(BaseModel):
    __tablename__ = "offers"
    
    cafe_id: Mapped[str] = mapped_column(String(36), ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    discount_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    start_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(SQLEnum(OfferStatus), nullable=False, default=OfferStatus.DRAFT)
