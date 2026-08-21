from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    description: str = Field(..., min_length=1, max_length=1000)
    price: Decimal = Field(..., gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    availability: bool = True


class ProductCreate(ProductBase):
    cafe_id: str


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    price: Optional[Decimal] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=500)
    availability: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    cafe_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)