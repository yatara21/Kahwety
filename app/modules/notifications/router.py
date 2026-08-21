from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission
from app.modules.notifications.service import NotificationService
from app.modules.notifications.schemas import NotificationCreate, NotificationResponse
from app.common.enums import PagePermission
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=SuccessResponse[PaginatedResponse[NotificationResponse]])
async def list_notifications(
    pagination: PaginationParams = Depends(),
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.NOTIFICATIONS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(session)
    notifications, total = await service.list_notifications(
        target_type=target_type,
        target_id=target_id,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{notification_id}", response_model=SuccessResponse[NotificationResponse])
async def get_notification(
    notification_id: str,
    current_user = Depends(require_page_permission(PagePermission.NOTIFICATIONS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(session)
    notification = await service.get_notification(notification_id)
    return SuccessResponse(data=NotificationResponse.model_validate(notification))


@router.post("", response_model=SuccessResponse[NotificationResponse])
async def create_notification(
    notification_create: NotificationCreate,
    current_user = Depends(require_page_permission(PagePermission.NOTIFICATIONS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(session)
    notification = await service.create_notification(notification_create)
    return SuccessResponse(data=NotificationResponse.model_validate(notification))


@router.delete("/{notification_id}", response_model=SuccessResponse[dict])
async def delete_notification(
    notification_id: str,
    current_user = Depends(require_page_permission(PagePermission.NOTIFICATIONS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(session)
    await service.delete_notification(notification_id)
    return SuccessResponse(data={"message": "Notification deleted successfully"})
