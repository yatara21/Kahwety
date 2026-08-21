from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission, get_current_user
from app.modules.cafes.service import CafeService
from app.modules.cafes.schemas import CafeCreate, CafeUpdate, CafeResponse
from app.common.enums import PagePermission, UserRole
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/cafes", tags=["Cafes"])


@router.get("/public", response_model=SuccessResponse[PaginatedResponse[CafeResponse]])
async def list_public_cafes(
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeService(session)
    cafes, total = await service.list_public_cafes(
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[CafeResponse.model_validate(c) for c in cafes],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("", response_model=SuccessResponse[PaginatedResponse[CafeResponse]])
async def list_all_cafes(
    pagination: PaginationParams = Depends(),
    registration_status: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.CAFES)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeService(session)
    cafes, total = await service.list_all_cafes(
        registration_status=registration_status,
        search=pagination.search,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[CafeResponse.model_validate(c) for c in cafes],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/nearby", response_model=SuccessResponse[PaginatedResponse[CafeResponse]])
async def list_nearby_cafes(
    latitude: float = Query(..., ge=-90, le=90, description="User latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="User longitude"),
    radius_km: float = Query(5.0, gt=0, le=100, description="Search radius in kilometers"),
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeService(session)
    cafes, total = await service.list_nearby_cafes(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[CafeResponse.model_validate(c) for c in cafes],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{cafe_id}", response_model=SuccessResponse[CafeResponse])
async def get_cafe(
    cafe_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeService(session)
    cafe = await service.get_cafe(cafe_id)
    return SuccessResponse(data=CafeResponse.model_validate(cafe))


@router.post("", response_model=SuccessResponse[CafeResponse])
async def create_cafe(
    cafe_create: CafeCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    from app.core.permissions import has_page_permission
    from app.core.exceptions import ForbiddenException

    if current_user.role != UserRole.CAFE_OWNER and not await has_page_permission(session, current_user, PagePermission.CAFES):
        raise ForbiddenException("Only cafe owners or admins can create cafes")
    
    service = CafeService(session)
    cafe = await service.create_cafe(cafe_create, current_user.id)
    return SuccessResponse(data=CafeResponse.model_validate(cafe))


@router.put("/{cafe_id}", response_model=SuccessResponse[CafeResponse])
async def update_cafe(
    cafe_id: str,
    cafe_update: CafeUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeService(session)
    cafe = await service.get_cafe(cafe_id)
    
    if current_user.role == UserRole.CAFE_OWNER and cafe.owner_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only update your own cafes")
    
    updated_cafe = await service.update_cafe(cafe_id, cafe_update)
    return SuccessResponse(data=CafeResponse.model_validate(updated_cafe))


@router.post("/{cafe_id}/approve", response_model=SuccessResponse[CafeResponse])
async def approve_cafe(
    cafe_id: str,
    current_user = Depends(require_page_permission(PagePermission.CAFES)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeService(session)
    cafe = await service.approve_cafe(cafe_id, current_user.id)
    return SuccessResponse(data=CafeResponse.model_validate(cafe))


@router.post("/{cafe_id}/reject", response_model=SuccessResponse[CafeResponse])
async def reject_cafe(
    cafe_id: str,
    current_user = Depends(require_page_permission(PagePermission.CAFES)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeService(session)
    cafe = await service.reject_cafe(cafe_id)
    return SuccessResponse(data=CafeResponse.model_validate(cafe))
