from sqlalchemy import String, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel


class Branch(BaseModel):
    __tablename__ = "branches"
    
    cafe_id: Mapped[str] = mapped_column(String(36), ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    place_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    working_hours: Mapped[dict | None] = mapped_column(JSON, nullable=True)
