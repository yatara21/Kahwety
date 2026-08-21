from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional, List
from datetime import datetime, timezone
from app.modules.subscriptions.models import Subscription
from app.common.enums import SubscriptionStatus


class SubscriptionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        *,
        user_id: str,
        plan_id: str,
        status: SubscriptionStatus = SubscriptionStatus.PENDING,
        starts_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
    ) -> Subscription:
        subscription = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            status=status,
            starts_at=starts_at,
            expires_at=expires_at,
        )
        self.session.add(subscription)
        await self.session.flush()
        await self.session.refresh(subscription)
        return subscription

    async def get_by_id(self, subscription_id: str) -> Optional[Subscription]:
        result = await self.session.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        return result.scalar_one_or_none()

    async def get_active_by_user(self, user_id: str) -> Optional[Subscription]:
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(Subscription)
            .where(
                and_(
                    Subscription.user_id == user_id,
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    Subscription.expires_at.is_not(None),
                    Subscription.expires_at > now,
                )
            )
            .order_by(Subscription.expires_at.desc())
        )
        return result.scalars().first()

    async def list_by_user(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Subscription], int]:
        query = select(Subscription).where(Subscription.user_id == user_id)
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0
        query = query.order_by(Subscription.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def list_all(
        self,
        status: Optional[SubscriptionStatus] = None,
        user_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Subscription], int]:
        query = select(Subscription)
        if status:
            query = query.where(Subscription.status == status)
        if user_id:
            query = query.where(Subscription.user_id == user_id)
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0
        query = query.order_by(Subscription.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def update(
        self,
        subscription: Subscription,
        *,
        status: Optional[SubscriptionStatus] = None,
        starts_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
    ) -> Subscription:
        if status is not None:
            subscription.status = status
        if starts_at is not None:
            subscription.starts_at = starts_at
        if expires_at is not None:
            subscription.expires_at = expires_at
        await self.session.flush()
        await self.session.refresh(subscription)
        return subscription

    async def activate(
        self,
        subscription: Subscription,
        *,
        starts_at: datetime,
        expires_at: datetime,
    ) -> Subscription:
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.starts_at = starts_at
        subscription.expires_at = expires_at
        await self.session.flush()
        await self.session.refresh(subscription)
        return subscription
