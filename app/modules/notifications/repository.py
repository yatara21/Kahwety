from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import Optional, List
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationCreate
from app.common.enums import NotificationTargetType, UserRole


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, notification_create: NotificationCreate, created_by: Optional[str] = None) -> Notification:
        notification = Notification(
            title=notification_create.title,
            message=notification_create.message,
            target_type=notification_create.target_type,
            target_id=notification_create.target_id,
            created_by=created_by
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
        
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0
        
        query = query.order_by(Notification.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.session.execute(query)
        notifications = result.scalars().all()
        
        return list(notifications), total

    async def list_for_user(
        self,
        user_id: str,
        user_role: UserRole,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Notification], int]:
        role_target = NotificationTargetType.CUSTOMER if user_role == UserRole.CUSTOMER else NotificationTargetType.CAFE_OWNER
        
        conditions = [
            Notification.target_type == NotificationTargetType.ALL,
            Notification.target_type == role_target,
            (Notification.target_type == NotificationTargetType.USER) & (Notification.target_id == user_id)
        ]
        
        query = select(Notification).where(or_(*conditions))
        
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0
        
        query = query.order_by(Notification.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.session.execute(query)
        notifications = result.scalars().all()
        
        return list(notifications), total
    
    async def delete(self, notification: Notification) -> None:
        await self.session.delete(notification)
        await self.session.flush()
