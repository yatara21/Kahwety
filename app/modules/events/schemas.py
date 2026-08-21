from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from app.common.enums import EventStatus


class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=1000)
    location: str = Field(..., min_length=1, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)
    event_date: datetime


class EventCreate(EventBase):
    cafe_id: str
    status: EventStatus = EventStatus.DRAFT


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    location: Optional[str] = Field(None, min_length=1, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)
    event_date: Optional[datetime] = None
    status: Optional[EventStatus] = None


class EventResponse(EventBase):
    id: str
    cafe_id: str
    status: EventStatus
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
