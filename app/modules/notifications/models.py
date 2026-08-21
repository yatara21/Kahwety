from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import NotificationTargetType


class Notification(BaseModel):
    __tablename__ = "notifications"
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String(2000), nullable=False)
    target_type: Mapped[str] = mapped_column(SQLEnum(NotificationTargetType), nullable=False)
    target_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
