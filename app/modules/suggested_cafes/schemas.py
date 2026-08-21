from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from app.common.enums import SuggestedCafeStatus


class SuggestedCafeBase(BaseModel):
    owner_name: str = Field(..., min_length=1, max_length=255)
    city: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)
    google_link: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    facebook: Optional[str] = Field(None, max_length=500)
    instagram: Optional[str] = Field(None, max_length=500)
    telegram: Optional[str] = Field(None, max_length=500)


class SuggestedCafeCreate(SuggestedCafeBase):
    pass


class SuggestedCafeUpdate(BaseModel):
    owner_name: Optional[str] = Field(None, min_length=1, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, min_length=1, max_length=50)
    google_link: Optional[str] = Field(None, max_length=500)
    status: Optional[SuggestedCafeStatus] = None
    admin_notes: Optional[str] = Field(None, max_length=2000)
    website: Optional[str] = Field(None, max_length=500)
    facebook: Optional[str] = Field(None, max_length=500)
    instagram: Optional[str] = Field(None, max_length=500)
    telegram: Optional[str] = Field(None, max_length=500)


class SuggestedCafeResponse(SuggestedCafeBase):
    id: str
    status: SuggestedCafeStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
