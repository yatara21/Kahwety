from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission, get_current_user
from app.modules.complaints.service import ComplaintService
from app.modules.complaints.schemas import ComplaintCreate, ComplaintUpdate, ComplaintResponse
from app.common.enums import PagePermission, UserRole
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/complaints", tags=["Complaints"])


class NotificationMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class CafeReplyMessage(BaseModel):
    reply: str = Field(..., min_length=1, max_length=2000)


@router.get("/customer/{customer_id}", response_model=SuccessResponse[PaginatedResponse[ComplaintResponse]])
async def list_complaints_by_customer(
    customer_id: str,
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    if current_user.role != UserRole.CUSTOMER or current_user.id != customer_id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only view your own complaints")
    
    service = ComplaintService(session)
    complaints, total = await service.list_complaints_by_customer(
        customer_id=customer_id,
        status=status,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[ComplaintResponse.model_validate(c) for c in complaints],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/cafe/{cafe_id}", response_model=SuccessResponse[PaginatedResponse[ComplaintResponse]])
async def list_complaints_by_cafe(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    from app.core.exceptions import ForbiddenException
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        await cafe_service.ensure_owner_owns_cafe(cafe_id, current_user.id)
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise ForbiddenException("Only cafe owners and admins can view cafe complaints")
    
    service = ComplaintService(session)
    complaints, total = await service.list_complaints_by_cafe(
        cafe_id=cafe_id,
        status=status,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[ComplaintResponse.model_validate(c) for c in complaints],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("", response_model=SuccessResponse[PaginatedResponse[ComplaintResponse]])
async def list_all_complaints(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    cafe_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.COMPLAINTS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = ComplaintService(session)
    complaints, total = await service.list_all_complaints(
        status=status,
        cafe_id=cafe_id,
        customer_id=customer_id,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[ComplaintResponse.model_validate(c) for c in complaints],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{complaint_id}", response_model=SuccessResponse[ComplaintResponse])
async def get_complaint(
    complaint_id: str,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = ComplaintService(session)
    complaint = await service.get_complaint(complaint_id)
    
    if current_user.role == UserRole.CUSTOMER and complaint.customer_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only view your own complaints")
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        await cafe_service.ensure_owner_owns_cafe(complaint.cafe_id, current_user.id)
    
    return SuccessResponse(data=ComplaintResponse.model_validate(complaint))


@router.post("", response_model=SuccessResponse[ComplaintResponse])
async def create_complaint(
    complaint_create: ComplaintCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    if current_user.role != UserRole.CUSTOMER:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only customers can create complaints")
    
    if complaint_create.customer_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only create complaints for yourself")
    
    service = ComplaintService(session)
    complaint = await service.create_complaint(complaint_create)
    return SuccessResponse(data=ComplaintResponse.model_validate(complaint))


@router.put("/{complaint_id}", response_model=SuccessResponse[ComplaintResponse])
async def update_complaint(
    complaint_id: str,
    complaint_update: ComplaintUpdate,
    current_user = Depends(require_page_permission(PagePermission.COMPLAINTS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = ComplaintService(session)
    complaint = await service.update_complaint(complaint_id, complaint_update)
    return SuccessResponse(data=ComplaintResponse.model_validate(complaint))


@router.post("/{complaint_id}/send-notification", response_model=SuccessResponse[ComplaintResponse])
async def send_notification(
    complaint_id: str,
    body: NotificationMessage,
    current_user = Depends(require_page_permission(PagePermission.COMPLAINTS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = ComplaintService(session)
    complaint = await service.send_notification(complaint_id, body.message)
    return SuccessResponse(data=ComplaintResponse.model_validate(complaint))


@router.post("/{complaint_id}/transfer", response_model=SuccessResponse[ComplaintResponse])
async def transfer_to_cafe(
    complaint_id: str,
    current_user = Depends(require_page_permission(PagePermission.COMPLAINTS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = ComplaintService(session)
    complaint = await service.transfer_to_cafe(complaint_id)
    return SuccessResponse(data=ComplaintResponse.model_validate(complaint))


@router.post("/{complaint_id}/resolve", response_model=SuccessResponse[ComplaintResponse])
async def resolve_complaint(
    complaint_id: str,
    current_user = Depends(require_page_permission(PagePermission.COMPLAINTS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = ComplaintService(session)
    complaint = await service.resolve_complaint(complaint_id)
    return SuccessResponse(data=ComplaintResponse.model_validate(complaint))


@router.post("/{complaint_id}/cafe-reply", response_model=SuccessResponse[ComplaintResponse])
async def cafe_reply(
    complaint_id: str,
    body: CafeReplyMessage,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    if current_user.role != UserRole.CAFE_OWNER:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only cafe owners can reply to complaints")

    service = ComplaintService(session)
    complaint = await service.get_complaint(complaint_id)

    from app.modules.cafes.service import CafeService
    cafe_service = CafeService(session)
    await cafe_service.ensure_owner_owns_cafe(complaint.cafe_id, current_user.id)

    updated = await service.cafe_reply(complaint_id, body.reply)
    return SuccessResponse(data=ComplaintResponse.model_validate(updated))
