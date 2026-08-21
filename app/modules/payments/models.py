from sqlalchemy import String, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import PaymentStatus


class Payment(BaseModel):
    __tablename__ = "payments"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subscription_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    moyasar_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="SAR")
    status: Mapped[str] = mapped_column(
        SQLEnum(PaymentStatus, name="paymentstatus", create_constraint=False),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True,
    )
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payment_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
