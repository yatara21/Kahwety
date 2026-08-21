from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_async_session
from app.core.permissions import require_page_permission, get_current_user
from app.modules.events.service import EventService
from app.modules.events.schemas import EventCreate, EventUpdate, EventResponse
from app.common.enums import PagePermission, UserRole
from app.common.responses import SuccessResponse
from app.common.pagination import PaginatedResponse, PaginationParams


router = APIRouter(prefix="/events", tags=["Events"])


@router.get("/cafe/{cafe_id}", response_model=SuccessResponse[PaginatedResponse[EventResponse]])
async def list_events_by_cafe(
    cafe_id: str,
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_async_session)
):
    service = EventService(session)
    events, total = await service.list_events_by_cafe(
        cafe_id=cafe_id,
        status=status,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[EventResponse.model_validate(e) for e in events],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("", response_model=SuccessResponse[PaginatedResponse[EventResponse]])
async def list_all_events(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    current_user = Depends(require_page_permission(PagePermission.EVENTS)),
    session: AsyncSession = Depends(get_async_session)
):
    service = EventService(session)
    events, total = await service.list_all_events(
        status=status,
        page=pagination.page,
        page_size=pagination.page_size
    )
    paginated = PaginatedResponse.create(
        items=[EventResponse.model_validate(e) for e in events],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size
    )
    return SuccessResponse(data=paginated)


@router.get("/{event_id}", response_model=SuccessResponse[EventResponse])
async def get_event(
    event_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    service = EventService(session)
    event = await service.get_event(event_id)
    return SuccessResponse(data=EventResponse.model_validate(event))


@router.post("", response_model=SuccessResponse[EventResponse])
async def create_event(
    event_create: EventCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    if current_user.role != UserRole.CAFE_OWNER:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only cafe owners can create events")
    
    from app.modules.cafes.service import CafeService
    cafe_service = CafeService(session)
    await cafe_service.ensure_owner_owns_cafe(event_create.cafe_id, current_user.id)

    service = EventService(session)
    event = await service.create_event(event_create)
    return SuccessResponse(data=EventResponse.model_validate(event))


@router.put("/{event_id}", response_model=SuccessResponse[EventResponse])
async def update_event(
    event_id: str,
    event_update: EventUpdate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = EventService(session)
    event = await service.get_event(event_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(event.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only update events of your own cafes")
    
    updated_event = await service.update_event(event_id, event_update)
    return SuccessResponse(data=EventResponse.model_validate(updated_event))


@router.delete("/{event_id}", response_model=SuccessResponse[dict])
async def delete_event(
    event_id: str,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    service = EventService(session)
    event = await service.get_event(event_id)
    
    if current_user.role == UserRole.CAFE_OWNER:
        from app.modules.cafes.service import CafeService
        cafe_service = CafeService(session)
        cafe = await cafe_service.get_cafe(event.cafe_id)
        if cafe.owner_id != current_user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("You can only delete events of your own cafes")
    
    await service.delete_event(event_id)
    return SuccessResponse(data={"message": "Event deleted successfully"})
