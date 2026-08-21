from sqlalchemy import String, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.common.models import BaseModel
from app.common.enums import PagePermission


class UserPagePermission(BaseModel):
    __tablename__ = "user_page_permissions"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    page: Mapped[str] = mapped_column(SQLEnum(PagePermission, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    __table_args__ = (
        UniqueConstraint("user_id", "page", name="uq_user_page_permission"),
    )
