from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime


class CouponBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    discount_percent: int = Field(..., ge=1, le=100)
    plan_id: Optional[str] = None
    max_uses: int = Field(..., ge=0)
    start_date: datetime
    end_date: datetime
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    discount_percent: Optional[int] = Field(None, ge=1, le=100)
    plan_id: Optional[str] = None
    max_uses: Optional[int] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponResponse(CouponBase):
    id: str
    used_count: int
    created_at: datetime
    updated_at: datetime
    plan: Optional["SubscriptionPlanResponse"] = None
    model_config = ConfigDict(from_attributes=True)


class SubscriptionPlanResponse(BaseModel):
    id: str
    name: str
    model_config = ConfigDict(from_attributes=True)
