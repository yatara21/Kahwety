from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.events.repository import EventRepository
from app.modules.events.schemas import EventCreate, EventUpdate
from app.modules.events.models import Event
from app.core.exceptions import NotFoundException


class EventService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_repository = EventRepository(session)
    
    async def create_event(self, event_create: EventCreate) -> Event:
        return await self.event_repository.create(event_create)
    
    async def get_event(self, event_id: str) -> Event:
        event = await self.event_repository.get_by_id(event_id)
        if not event:
            raise NotFoundException("Event not found")
        return event
    
    async def list_events_by_cafe(
        self,
        cafe_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Event], int]:
        return await self.event_repository.list_by_cafe(cafe_id, status, page, page_size)
    
    async def list_all_events(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Event], int]:
        return await self.event_repository.list_all(status, page, page_size)
    
    async def update_event(self, event_id: str, event_update: EventUpdate) -> Event:
        event = await self.get_event(event_id)
        return await self.event_repository.update(event, event_update)
    
    async def delete_event(self, event_id: str) -> None:
        event = await self.get_event(event_id)
        await self.event_repository.delete(event)
