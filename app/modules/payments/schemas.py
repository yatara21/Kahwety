from pydantic import ConfigDict, BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from decimal import Decimal
from app.common.enums import PaymentStatus


class PaymentResponse(BaseModel):
    id: str
    user_id: str
    subscription_id: str
    moyasar_payment_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: PaymentStatus
    payment_method: Optional[str] = None
    payment_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class MoyasarWebhookPayload(BaseModel):
    id: Optional[str] = None
    type: Optional[str] = None
    created_at: Optional[str] = None
    secret_token: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    # Direct payment/invoice payload support
    status: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None

    model_config = ConfigDict(extra="allow")


class WebhookResponse(BaseModel):
    status: str
    payment_id: str
    event: Optional[str] = None
    moyasar_status: Optional[str] = None
