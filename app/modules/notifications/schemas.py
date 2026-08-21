from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from app.common.enums import NotificationTargetType


class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=2000)
    target_type: NotificationTargetType
    target_id: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
