from pydantic import ConfigDict, BaseModel, Field, computed_field
from typing import Optional
from datetime import datetime, timezone


class CouponBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    discount_percent: int = Field(..., ge=1, le=100)
    plan_id: Optional[str] = None
    max_uses: int = Field(default=0, ge=0)
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

    @computed_field
    @property
    def status(self) -> str:
        if not self.is_active:
            return "TERMINATED"
        now = datetime.now(timezone.utc)
        end = self.end_date if self.end_date.tzinfo else self.end_date.replace(tzinfo=timezone.utc)
        if end < now:
            return "EXPIRED"
        return "ACTIVE"


class SubscriptionPlanResponse(BaseModel):
    id: str
    name: str
    model_config = ConfigDict(from_attributes=True)
