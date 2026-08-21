from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationCreate


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, notification_create: NotificationCreate) -> Notification:
        notification = Notification(
            title=notification_create.title,
            message=notification_create.message,
            target_type=notification_create.target_type,
            target_id=notification_create.target_id
        )
        self.session.add(notification)
        await self.session.flush()
        await self.session.refresh(notification)
        return notification
    
    async def get_by_id(self, notification_id: str) -> Optional[Notification]:
        result = await self.session.execute(select(Notification).where(Notification.id == notification_id))
        return result.scalar_one_or_none()
    
    async def list_all(
        self,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Notification], int]:
        query = select(Notification)
        
        if target_type:
            query = query.where(Notification.target_type == target_type)
        if target_id:
            query = query.where(Notification.target_id == target_id)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Notification.created_at.desc())
        
        result = await self.session.execute(query)
        notifications = result.scalars().all()
        
        return list(notifications), total
    
    async def delete(self, notification: Notification) -> None:
        await self.session.delete(notification)
        await self.session.flush()
