from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from app.common.enums import ComplaintStatus


class ComplaintBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=2000)


class ComplaintCreate(ComplaintBase):
    customer_id: str
    cafe_id: str


class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    admin_response: Optional[str] = Field(None, max_length=2000)
    cafe_response: Optional[str] = Field(None, max_length=2000)


class ComplaintResponse(ComplaintBase):
    id: str
    customer_id: str
    cafe_id: str
    status: ComplaintStatus
    admin_response: Optional[str] = None
    cafe_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
