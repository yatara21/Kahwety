from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.common.enums import SubscriberType, BillingCycle


class SubscriptionPlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    subscriber_type: SubscriberType
    billing_cycle: BillingCycle
    price: Decimal = Field(..., gt=0)
    currency: str = Field(default="SAR", min_length=3, max_length=3)
    duration_days: int = Field(..., gt=0)
    is_active: bool = True


class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass


class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    subscriber_type: Optional[SubscriberType] = None
    billing_cycle: Optional[BillingCycle] = None
    price: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    duration_days: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None


class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
