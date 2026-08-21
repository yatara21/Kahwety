from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.subscription_plans.service import SubscriptionPlanService
from app.modules.subscription_plans.schemas import (
    SubscriptionPlanCreate,
    SubscriptionPlanUpdate,
    SubscriptionPlanResponse,
)
from app.common.enums import PagePermission, SubscriberType, BillingCycle
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/admin/subscription-plans", tags=["Admin - Subscription Plans"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[SubscriptionPlanResponse]])
async def list_plans(
    pagination: PaginationParams = Depends(),
    is_active: Optional[bool] = None,
    subscriber_type: Optional[SubscriberType] = None,
    billing_cycle: Optional[BillingCycle] = None,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionPlanService(session)
    plans, total = await service.list_plans(
        is_active=is_active,
        subscriber_type=subscriber_type,
        billing_cycle=billing_cycle,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    paginated = PaginatedResponse.create(
        items=[SubscriptionPlanResponse.model_validate(p) for p in plans],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(data=paginated)


@router.get("/{plan_id}", response_model=SuccessResponse[SubscriptionPlanResponse])
async def get_plan(
    plan_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionPlanService(session)
    plan = await service.get_plan(plan_id)
    return SuccessResponse(data=SubscriptionPlanResponse.model_validate(plan))


@router.post("", response_model=SuccessResponse[SubscriptionPlanResponse])
async def create_plan(
    plan_create: SubscriptionPlanCreate,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionPlanService(session)
    plan = await service.create_plan(plan_create)
    return SuccessResponse(data=SubscriptionPlanResponse.model_validate(plan))


@router.put("/{plan_id}", response_model=SuccessResponse[SubscriptionPlanResponse])
async def update_plan(
    plan_id: str,
    plan_update: SubscriptionPlanUpdate,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionPlanService(session)
    plan = await service.update_plan(plan_id, plan_update)
    return SuccessResponse(data=SubscriptionPlanResponse.model_validate(plan))


@router.patch("/{plan_id}/activate", response_model=SuccessResponse[SubscriptionPlanResponse])
async def activate_plan(
    plan_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionPlanService(session)
    plan = await service.activate_plan(plan_id)
    return SuccessResponse(data=SubscriptionPlanResponse.model_validate(plan))


@router.patch("/{plan_id}/deactivate", response_model=SuccessResponse[SubscriptionPlanResponse])
async def deactivate_plan(
    plan_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SubscriptionPlanService(session)
    plan = await service.deactivate_plan(plan_id)
    return SuccessResponse(data=SubscriptionPlanResponse.model_validate(plan))
