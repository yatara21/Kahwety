from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.suggested_cafes.service import SuggestedCafeService
from app.modules.suggested_cafes.schemas import (
    SuggestedCafeCreate,
    SuggestedCafeUpdate,
    SuggestedCafeResponse,
)
from app.common.enums import PagePermission
from app.common.responses import MessageResponse, SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/suggested-cafes", tags=["Suggested Cafes"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[SuggestedCafeResponse]])
async def list_suggested_cafes(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    current_user=Depends(require_page_permission(PagePermission.SUGGESTED_CAFES)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    cafes, total = await service.list_all(
        status=status,
        city=city,
        search=search,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    paginated = PaginatedResponse.create(
        items=[SuggestedCafeResponse.model_validate(c) for c in cafes],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return SuccessResponse(data=paginated)


@router.get("/{cafe_id}", response_model=SuccessResponse[SuggestedCafeResponse])
async def get_suggested_cafe(
    cafe_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUGGESTED_CAFES)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    cafe = await service.get(cafe_id)
    return SuccessResponse(data=SuggestedCafeResponse.model_validate(cafe))


@router.post("", response_model=SuccessResponse[SuggestedCafeResponse])
async def create_suggested_cafe(
    data: SuggestedCafeCreate,
    current_user=Depends(require_page_permission(PagePermission.SUGGESTED_CAFES)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    cafe = await service.create(data)
    return SuccessResponse(data=SuggestedCafeResponse.model_validate(cafe))


@router.put("/{cafe_id}", response_model=SuccessResponse[SuggestedCafeResponse])
async def update_suggested_cafe(
    cafe_id: str,
    data: SuggestedCafeUpdate,
    current_user=Depends(require_page_permission(PagePermission.SUGGESTED_CAFES)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    cafe = await service.update(cafe_id, data)
    return SuccessResponse(data=SuggestedCafeResponse.model_validate(cafe))


@router.post("/{cafe_id}/approve", response_model=SuccessResponse[SuggestedCafeResponse])
async def approve_suggested_cafe(
    cafe_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUGGESTED_CAFES)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    cafe = await service.approve(cafe_id)
    return SuccessResponse(data=SuggestedCafeResponse.model_validate(cafe))


@router.post("/{cafe_id}/reject", response_model=SuccessResponse[SuggestedCafeResponse])
async def reject_suggested_cafe(
    cafe_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUGGESTED_CAFES)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    cafe = await service.reject(cafe_id)
    return SuccessResponse(data=SuggestedCafeResponse.model_validate(cafe))


@router.delete("/{cafe_id}", response_model=SuccessResponse[MessageResponse])
async def delete_suggested_cafe(
    cafe_id: str,
    current_user=Depends(require_page_permission(PagePermission.SUGGESTED_CAFES)),
    session: AsyncSession = Depends(get_async_session),
):
    service = SuggestedCafeService(session)
    await service.delete(cafe_id)
    return SuccessResponse(data=MessageResponse(message="Suggested cafe deleted"))
