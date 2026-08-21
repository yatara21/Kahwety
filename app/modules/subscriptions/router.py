from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.subscriptions.service import SubscriptionService
from app.modules.subscriptions.schemas import SubscriptionResponse
from app.common.enums import PagePermission, SubscriptionStatus
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/admin/subscriptions", tags=["Admin - Subscriptions"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[SubscriptionResponse]])
async def list_subscriptions(
    pagination: PaginationParams = Depends(),
    status: Optional[SubscriptionStatus] = None,
    user_id: Optional[str] = None,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionService(session)
    subscriptions, total = await service.list_subscriptions(
        status=status.value if status else None,
        user_id=user_id,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    paginated = PaginatedResponse.create(
        items=[SubscriptionResponse.model_validate(s) for s in subscriptions],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(data=paginated)


@router.get("/{subscription_id}", response_model=SuccessResponse[SubscriptionResponse])
async def get_subscription(
    subscription_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionService(session)
    subscription = await service.get_subscription(subscription_id)
    return SuccessResponse(data=SubscriptionResponse.model_validate(subscription))
