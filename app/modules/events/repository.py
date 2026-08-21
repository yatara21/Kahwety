from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.modules.events.models import Event
from app.modules.events.schemas import EventCreate, EventUpdate


class EventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, event_create: EventCreate) -> Event:
        event = Event(
            cafe_id=event_create.cafe_id,
            title=event_create.title,
            description=event_create.description,
            location=event_create.location,
            event_date=event_create.event_date,
            status=event_create.status
        )
        self.session.add(event)
        await self.session.flush()
        await self.session.refresh(event)
        return event
    
    async def get_by_id(self, event_id: str) -> Optional[Event]:
        result = await self.session.execute(select(Event).where(Event.id == event_id))
        return result.scalar_one_or_none()
    
    async def list_by_cafe(
        self,
        cafe_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Event], int]:
        query = select(Event).where(Event.cafe_id == cafe_id)
        
        if status:
            query = query.where(Event.status == status)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Event.event_date.asc())
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        return list(events), total
    
    async def list_all(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Event], int]:
        query = select(Event)
        
        if status:
            query = query.where(Event.status == status)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Event.event_date.asc())
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        return list(events), total
    
    async def update(self, event: Event, event_update: EventUpdate) -> Event:
        if event_update.title is not None:
            event.title = event_update.title
        if event_update.description is not None:
            event.description = event_update.description
        if event_update.location is not None:
            event.location = event_update.location
        if event_update.event_date is not None:
            event.event_date = event_update.event_date
        if event_update.status is not None:
            event.status = event_update.status
        
        await self.session.flush()
        await self.session.refresh(event)
        return event
    
    async def delete(self, event: Event) -> None:
        await self.session.delete(event)
        await self.session.flush()
