from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class CustomerStatisticsResponse(BaseModel):
    user_id: str
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    total_spent: Decimal
    model_config = ConfigDict(from_attributes=True)
class CustomerResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    statistics: Optional[CustomerStatisticsResponse] = None
    model_config = ConfigDict(from_attributes=True)
class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = None
