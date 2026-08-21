from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.subscriptions.repository import SubscriptionRepository
from app.modules.subscriptions.models import Subscription
from app.modules.payments.service import PaymentService
from app.core.exceptions import NotFoundException
from app.common.enums import SubscriptionStatus


class SubscriptionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.subscription_repository = SubscriptionRepository(session)
        self.payment_service = PaymentService(session)

    async def subscribe(self, user, plan_id: str) -> dict:
        return await self.payment_service.create_subscription_checkout(user=user, plan_id=plan_id)

    async def get_subscription(self, subscription_id: str) -> Subscription:
        subscription = await self.subscription_repository.get_by_id(subscription_id)
        if not subscription:
            raise NotFoundException("Subscription not found")
        return subscription

    async def get_my_subscription(self, user_id: str) -> Optional[Subscription]:
        return await self.subscription_repository.get_active_by_user(user_id)

    async def list_history(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Subscription], int]:
        return await self.subscription_repository.list_by_user(user_id, page=page, page_size=page_size)

    async def list_subscriptions(
        self,
        status: Optional[str] = None,
        user_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Subscription], int]:
        status_enum = SubscriptionStatus(status) if status else None
        return await self.subscription_repository.list_all(
            status=status_enum,
            user_id=user_id,
            page=page,
            page_size=page_size,
        )
