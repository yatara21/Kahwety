from sqlalchemy import String, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import ComplaintStatus


class Complaint(BaseModel):
    __tablename__ = "complaints"
    
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    cafe_id: Mapped[str] = mapped_column(String(36), ForeignKey("cafes.id", ondelete="CASCADE"), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    status: Mapped[str] = mapped_column(SQLEnum(ComplaintStatus), nullable=False, default=ComplaintStatus.PENDING)
    admin_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    cafe_response: Mapped[str | None] = mapped_column(Text, nullable=True)
