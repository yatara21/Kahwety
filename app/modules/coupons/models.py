from sqlalchemy import String, Integer, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSON
from app.common.models import BaseModel


class Coupon(BaseModel):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    discount_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    plan_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True
    )
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    used_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    start_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
