import logging
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreate
from app.modules.notifications.models import Notification
from app.modules.users.repository import UserRepository
from app.modules.cafes.repository import CafeRepository
from app.core.exceptions import NotFoundException
from app.common.enums import NotificationTargetType, UserRole
from app.services.sms import get_sms_provider

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.notification_repository = NotificationRepository(session)
        self.user_repository = UserRepository(session)
        self.cafe_repository = CafeRepository(session)

    async def _resolve_target_phones(self, target_type: NotificationTargetType, target_id: Optional[str]) -> List[str]:
        phones: List[str] = []

        if target_type == NotificationTargetType.ALL:
            phones.extend(await self.user_repository.list_phones_by_role(UserRole.CUSTOMER))
            phones.extend(await self.user_repository.list_phones_by_role(UserRole.CAFE_OWNER))
        elif target_type == NotificationTargetType.CUSTOMER:
            if target_id:
                user = await self.user_repository.get_by_id(target_id)
                if user and user.phone:
                    phones.append(user.phone)
        elif target_type == NotificationTargetType.CAFE_OWNER:
            if target_id:
                user = await self.user_repository.get_by_id(target_id)
                if user and user.phone:
                    phones.append(user.phone)
        elif target_type == NotificationTargetType.USER:
            if target_id:
                user = await self.user_repository.get_by_id(target_id)
                if user and user.phone:
                    phones.append(user.phone)
        elif target_type == NotificationTargetType.CAFE:
            if target_id:
                cafe = await self.cafe_repository.get_by_id(target_id)
                if cafe:
                    owner = await self.user_repository.get_by_id(cafe.owner_id)
                    if owner and owner.phone:
                        phones.append(owner.phone)

        return list(dict.fromkeys(phones))

    async def create_notification(self, notification_create: NotificationCreate) -> Notification:
        notification = await self.notification_repository.create(notification_create)

        try:
            phones = await self._resolve_target_phones(
                NotificationTargetType(notification.target_type),
                notification.target_id,
            )
            if phones:
                sms_provider = get_sms_provider()
                message = f"{notification.title}\n{notification.message}"
                for phone in phones:
                    await sms_provider.send_sms(phone, message)
        except Exception as exc:
            logger.exception("Failed to send SMS notification: %s", exc)

        return notification

    async def get_notification(self, notification_id: str) -> Notification:
        notification = await self.notification_repository.get_by_id(notification_id)
        if not notification:
            raise NotFoundException("Notification not found")
        return notification

    async def list_notifications(
        self,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Notification], int]:
        return await self.notification_repository.list_all(target_type, target_id, page, page_size)

    async def delete_notification(self, notification_id: str) -> None:
        notification = await self.get_notification(notification_id)
        await self.notification_repository.delete(notification)