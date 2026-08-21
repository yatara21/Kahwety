from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel


class CustomerStatistics(BaseModel):
    __tablename__ = "customer_statistics"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    total_orders: Mapped[int] = mapped_column(default=0, nullable=False)
    completed_orders: Mapped[int] = mapped_column(default=0, nullable=False)
    cancelled_orders: Mapped[int] = mapped_column(default=0, nullable=False)
    total_spent: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
