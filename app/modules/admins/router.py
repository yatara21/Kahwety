from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import get_current_super_admin, require_page_permission
from app.modules.admins.service import AdminService
from app.modules.admins.schemas import AdminResponse, AdminCreate, AdminUpdate, AssignPagePermissionsRequest
from app.common.enums import PagePermission
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/admins", tags=["Admins"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[AdminResponse]])
async def list_admins(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.ADMINS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = AdminService(session)
    admins, total = await service.list_admins(
        status=status,
        search=pagination.search,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[AdminResponse.model_validate(a) for a in admins],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{admin_id}", response_model=SuccessResponse[AdminResponse])
async def get_admin(
    admin_id: str,
    current_user = Depends(require_page_permission(PagePermission.ADMINS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = AdminService(session)
    admin = await service.get_admin(admin_id)
    return SuccessResponse(data=AdminResponse.model_validate(admin))


@router.post("", response_model=SuccessResponse[AdminResponse])
async def create_admin(
    admin_create: AdminCreate,
    current_user = Depends(get_current_super_admin),
    session: AsyncSession = Depends(get_async_session)
):
    service = AdminService(session)
    admin = await service.create_admin(admin_create, current_user.role)
    return SuccessResponse(data=AdminResponse.model_validate(admin))


@router.put("/{admin_id}", response_model=SuccessResponse[AdminResponse])
async def update_admin(
    admin_id: str,
    admin_update: AdminUpdate,
    current_user = Depends(require_page_permission(PagePermission.ADMINS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = AdminService(session)
    admin = await service.update_admin(admin_id, admin_update, current_user.role, current_user.id)
    return SuccessResponse(data=AdminResponse.model_validate(admin))


@router.get("/{admin_id}/permissions", response_model=SuccessResponse[list[PagePermission]])
async def get_admin_permissions(
    admin_id: str,
    current_user = Depends(require_page_permission(PagePermission.ADMINS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = AdminService(session)
    permissions = await service.get_admin_permissions(admin_id)
    return SuccessResponse(data=permissions)


@router.put("/{admin_id}/permissions", response_model=SuccessResponse[list[PagePermission]])
async def assign_admin_permissions(
    admin_id: str,
    request: AssignPagePermissionsRequest,
    current_user = Depends(get_current_super_admin),
    session: AsyncSession = Depends(get_async_session)
):
    service = AdminService(session)
    permissions = await service.assign_permissions(admin_id, request)
    return SuccessResponse(data=permissions)
