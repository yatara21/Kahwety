from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.coupons.service import CouponService
from app.modules.coupons.schemas import CouponCreate, CouponUpdate, CouponResponse
from app.common.enums import PagePermission
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[CouponResponse]])
async def list_coupons(
    pagination: PaginationParams = Depends(),
    is_active: Optional[bool] = None,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = CouponService(session)
    coupons, total = await service.list_coupons(
        is_active=is_active,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    paginated = PaginatedResponse.create(
        items=[CouponResponse.model_validate(c) for c in coupons],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(data=paginated)


@router.get("/{coupon_id}", response_model=SuccessResponse[CouponResponse])
async def get_coupon(
    coupon_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = CouponService(session)
    coupon = await service.get_coupon(coupon_id)
    return SuccessResponse(data=CouponResponse.model_validate(coupon))


@router.post("", response_model=SuccessResponse[CouponResponse])
async def create_coupon(
    coupon_create: CouponCreate,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = CouponService(session)
    coupon = await service.create_coupon(coupon_create)
    return SuccessResponse(data=CouponResponse.model_validate(coupon))


@router.put("/{coupon_id}", response_model=SuccessResponse[CouponResponse])
async def update_coupon(
    coupon_id: str,
    coupon_update: CouponUpdate,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = CouponService(session)
    coupon = await service.update_coupon(coupon_id, coupon_update)
    return SuccessResponse(data=CouponResponse.model_validate(coupon))


@router.delete("/{coupon_id}", response_model=SuccessResponse[dict])
async def delete_coupon(
    coupon_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUBSCRIPTIONS)),
    session: AsyncSession = Depends(get_async_session),
):
    service = CouponService(session)
    await service.delete_coupon(coupon_id)
    return SuccessResponse(data={"message": "Coupon deleted successfully"})
