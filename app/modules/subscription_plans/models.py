from sqlalchemy import String, Boolean, Integer, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import SubscriberType, BillingCycle


class SubscriptionPlan(BaseModel):
    __tablename__ = "subscription_plans"

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subscriber_type: Mapped[str] = mapped_column(
        SQLEnum(SubscriberType, name="subscriber_type", create_constraint=False),
        nullable=False,
        index=True,
    )
    billing_cycle: Mapped[str] = mapped_column(
        SQLEnum(BillingCycle, name="billing_cycle", create_constraint=False),
        nullable=False,
        index=True,
    )
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="SAR")
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
