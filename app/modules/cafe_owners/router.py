from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.cafe_owners.service import CafeOwnerService
from app.modules.cafe_owners.schemas import CafeOwnerResponse, CafeOwnerUpdate
from app.common.enums import PagePermission
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/cafe-owners", tags=["Cafe Owners"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[CafeOwnerResponse]])
async def list_cafe_owners(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.CAFE_OWNERS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeOwnerService(session)
    owners, total = await service.list_cafe_owners(
        status=status,
        search=pagination.search,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[CafeOwnerResponse.model_validate(o) for o in owners],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{owner_id}", response_model=SuccessResponse[CafeOwnerResponse])
async def get_cafe_owner(
    owner_id: str,
    current_user = Depends(require_page_permission(PagePermission.CAFE_OWNERS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeOwnerService(session)
    owner = await service.get_cafe_owner(owner_id)
    return SuccessResponse(data=CafeOwnerResponse.model_validate(owner))


@router.put("/{owner_id}", response_model=SuccessResponse[CafeOwnerResponse])
async def update_cafe_owner(
    owner_id: str,
    owner_update: CafeOwnerUpdate,
    current_user = Depends(require_page_permission(PagePermission.CAFE_OWNERS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = CafeOwnerService(session)
    owner = await service.update_cafe_owner(owner_id, owner_update)
    return SuccessResponse(data=CafeOwnerResponse.model_validate(owner))
