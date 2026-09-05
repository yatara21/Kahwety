from pydantic import BaseModel, Field
from typing import Optional


class MobileComplaintCreate(BaseModel):
    cafe_id: str
    subject: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=2000)


class MobileSuggestedCafeCreate(BaseModel):
    owner_name: str = Field(..., min_length=1, max_length=255)
    city: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)
    google_link: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=500)
    facebook: Optional[str] = Field(None, max_length=500)
    instagram: Optional[str] = Field(None, max_length=500)
    telegram: Optional[str] = Field(None, max_length=500)
