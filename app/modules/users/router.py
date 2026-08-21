from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import get_current_admin
from app.modules.users.service import UserService
from app.modules.users.schemas import UserCreate, UserUpdate, UserResponse
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[UserResponse]])
async def list_users(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(get_current_admin),
    session: AsyncSession = Depends(get_async_session)
):
    service = UserService(session)
    users, total = await service.list_all_users(
        status=status,
        search=pagination.search,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{user_id}", response_model=SuccessResponse[UserResponse])
async def get_user(
    user_id: str,
    current_user = Depends(get_current_admin),
    session: AsyncSession = Depends(get_async_session)
):
    service = UserService(session)
    user = await service.get_user(user_id)
    return SuccessResponse(data=UserResponse.model_validate(user))


@router.post("", response_model=SuccessResponse[UserResponse])
async def create_user(
    user_create: UserCreate,
    current_user = Depends(get_current_admin),
    session: AsyncSession = Depends(get_async_session)
):
    service = UserService(session)
    user = await service.create_user(user_create)
    return SuccessResponse(data=UserResponse.model_validate(user))


@router.put("/{user_id}", response_model=SuccessResponse[UserResponse])
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user = Depends(get_current_admin),
    session: AsyncSession = Depends(get_async_session)
):
    service = UserService(session)
    user = await service.update_user(user_id, user_update)
    return SuccessResponse(data=UserResponse.model_validate(user))
