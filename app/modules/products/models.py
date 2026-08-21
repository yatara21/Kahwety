from sqlalchemy import String, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel


class Product(BaseModel):
    __tablename__ = "products"
    
    cafe_id: Mapped[str] = mapped_column(String(36), ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    availability: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)