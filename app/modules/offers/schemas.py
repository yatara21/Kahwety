from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from app.common.enums import OfferStatus


class OfferBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=1000)
    discount_percentage: int = Field(..., ge=0, le=100)
    image_url: Optional[str] = Field(None, max_length=500)
    start_date: datetime
    end_date: datetime


class OfferCreate(OfferBase):
    cafe_id: str
    status: OfferStatus = OfferStatus.DRAFT


class OfferUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    discount_percentage: Optional[int] = Field(None, ge=0, le=100)
    image_url: Optional[str] = Field(None, max_length=500)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[OfferStatus] = None


class OfferResponse(OfferBase):
    id: str
    cafe_id: str
    status: OfferStatus
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
