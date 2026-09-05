from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime
from app.common.enums import SubscriptionStatus


class SubscriptionCreateRequest(BaseModel):
    plan_id: str = Field(..., min_length=1)


class SubscribeResponse(BaseModel):
    subscription_id: str
    payment_id: str
    payment_url: str


from app.modules.subscription_plans.schemas import SubscriptionPlanResponse


class SubscriptionUserSummary(BaseModel):
    id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: SubscriptionStatus
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[SubscriptionUserSummary] = None
    plan: Optional[SubscriptionPlanResponse] = None
    model_config = ConfigDict(from_attributes=True)


class SubscriptionUpdate(BaseModel):
    status: Optional[SubscriptionStatus] = None
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
