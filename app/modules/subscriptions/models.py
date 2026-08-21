from sqlalchemy import String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import SubscriptionStatus


class Subscription(BaseModel):
    __tablename__ = "subscriptions"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        SQLEnum(SubscriptionStatus, name="subscriptionstatus", create_constraint=False),
        nullable=False,
        default=SubscriptionStatus.PENDING,
        index=True,
    )
    starts_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
