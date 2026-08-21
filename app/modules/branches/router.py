from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.permissions import get_current_user
from app.modules.branches.service import BranchService
from app.modules.branches.schemas import BranchCreate, BranchUpdate, BranchResponse
from app.common.enums import UserRole
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/branches", tags=["Branches"])


@router.get("/cafe/{cafe_id}", response_model=SuccessResponse[PaginatedResponse[BranchResponse]])
async def list_branches_by_cafe(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    service = BranchService(session)
    branches, total = await service.list_branches_by_cafe(
        cafe_id=cafe_id,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[BranchResponse.model_validate(b) for b in branches],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{branch_id}", response_model=SuccessResponse[BranchResponse])
async def get_branch(
    branch_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    service = BranchService(session)
    branch = await service.get_branch(branch_id)
    return SuccessResponse(data=BranchResponse.model_validate(branch))


@router.post("", response_model=SuccessResponse[BranchResponse])
async def create_branch(
    branch_create: BranchCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    from app.core.exceptions import ForbiddenException
    from app.core.permissions import has_page_permission
    from app.common.enums import PagePermission

    if current_user.role != UserRole.CAFE_OWNER and not await has_page_permission(session, current_user, PagePermission.CAFES):
        raise ForbiddenException("Only cafe owners or admins can create branches")
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        await cafe_service.ensure_owner_owns_cafe(branch_create.cafe_id, current_user.id)

    service = BranchService(session)
    branch = await service.create_branch(branch_create)
    return SuccessResponse(data=BranchResponse.model_validate(branch))


@router.put("/{branch_id}", response_model=SuccessResponse[BranchResponse])
async def update_branch(
    branch_id: str,
    branch_update: BranchUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = BranchService(session)
    branch = await service.get_branch(branch_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(branch.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only update branches of your own cafes")
    
    updated_branch = await service.update_branch(branch_id, branch_update)
    return SuccessResponse(data=BranchResponse.model_validate(updated_branch))


@router.delete("/{branch_id}", response_model=SuccessResponse[dict])
async def delete_branch(
    branch_id: str,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = BranchService(session)
    branch = await service.get_branch(branch_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(branch.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only delete branches of your own cafes")
    
    await service.delete_branch(branch_id)
    return SuccessResponse(data={"message": "Branch deleted successfully"})
