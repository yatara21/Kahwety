from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.responses import SuccessResponse
from app.core.database import get_async_session
from app.modules.payments.schemas import WebhookResponse
from app.modules.payments.service import PaymentService


router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/moyasar", response_model=SuccessResponse[WebhookResponse])
async def moyasar_webhook(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    x_moyasar_token: Optional[str] = Header(default=None, alias="X-Moyasar-Token"),
    x_webhook_secret: Optional[str] = Header(default=None, alias="X-Webhook-Secret"),
):
    """
    Moyasar webhook / invoice callback endpoint.

    Activation is performed only after server-side verification with Moyasar API.
    """
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        payload = {}

    secret = x_moyasar_token or x_webhook_secret
    result = await PaymentService(session).process_webhook(payload, secret_token=secret)
    return SuccessResponse(data=result)
