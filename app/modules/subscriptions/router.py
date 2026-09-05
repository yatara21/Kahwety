from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.subscriptions.service import SubscriptionService
from app.modules.subscriptions.schemas import SubscriptionResponse, SubscriptionUpdate
from app.common.enums import PagePermission, SubscriptionStatus
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(tags=["Admin - Subscriptions"])


class AdminSubscriptionCreate(BaseModel):
    user_id: str
    plan_id: str
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


@router.get("/admin/subscriptions", response_model=SuccessResponse[PaginatedResponse[SubscriptionResponse]])
@router.get("/subscriptions", response_model=SuccessResponse[PaginatedResponse[SubscriptionResponse]])
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


@router.get("/admin/subscriptions/{subscription_id}", response_model=SuccessResponse[SubscriptionResponse])
@router.get("/subscriptions/{subscription_id}", response_model=SuccessResponse[SubscriptionResponse])
async def get_subscription(
    subscription_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionService(session)
    subscription = await service.get_subscription(subscription_id)
    return SuccessResponse(data=SubscriptionResponse.model_validate(subscription))


@router.post("/admin/subscriptions", response_model=SuccessResponse[SubscriptionResponse])
@router.post("/subscriptions", response_model=SuccessResponse[SubscriptionResponse])
async def create_subscription(
    body: AdminSubscriptionCreate,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionService(session)
    subscription = await service.admin_create_subscription(
        user_id=body.user_id,
        plan_id=body.plan_id,
        status=body.status,
        starts_at=body.starts_at,
        expires_at=body.expires_at,
    )
    return SuccessResponse(data=SubscriptionResponse.model_validate(subscription))


@router.put("/admin/subscriptions/{subscription_id}", response_model=SuccessResponse[SubscriptionResponse])
@router.put("/subscriptions/{subscription_id}", response_model=SuccessResponse[SubscriptionResponse])
async def update_subscription(
    subscription_id: str,
    body: SubscriptionUpdate,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionService(session)
    subscription = await service.admin_update_subscription(
        subscription_id,
        status=body.status,
        starts_at=body.starts_at,
        expires_at=body.expires_at,
    )
    return SuccessResponse(data=SubscriptionResponse.model_validate(subscription))


@router.patch("/admin/subscriptions/{subscription_id}/renew", response_model=SuccessResponse[SubscriptionResponse])
@router.patch("/subscriptions/{subscription_id}/renew", response_model=SuccessResponse[SubscriptionResponse])
async def renew_subscription(
    subscription_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionService(session)
    subscription = await service.admin_renew_subscription(subscription_id)
    return SuccessResponse(data=SubscriptionResponse.model_validate(subscription))


@router.post("/admin/subscriptions/{subscription_id}/cancel", response_model=SuccessResponse[SubscriptionResponse])
@router.post("/subscriptions/{subscription_id}/cancel", response_model=SuccessResponse[SubscriptionResponse])
async def cancel_subscription(
    subscription_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionService(session)
    subscription = await service.admin_cancel_subscription(subscription_id)
    return SuccessResponse(data=SubscriptionResponse.model_validate(subscription))
