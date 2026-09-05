from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from app.modules.subscriptions.repository import SubscriptionRepository
from app.modules.subscriptions.models import Subscription
from app.modules.subscription_plans.repository import SubscriptionPlanRepository
from app.modules.payments.service import PaymentService
from app.core.exceptions import NotFoundException, BusinessException
from app.common.enums import SubscriptionStatus


class SubscriptionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.subscription_repository = SubscriptionRepository(session)
        self.payment_service = PaymentService(session)

    async def _enrich_subscriptions(self, subscriptions: List[Subscription]) -> List[Subscription]:
        if not subscriptions:
            return subscriptions
        from app.modules.users.models import User
        from app.modules.subscription_plans.models import SubscriptionPlan
        from sqlalchemy import select
        
        user_ids = list({s.user_id for s in subscriptions if s.user_id})
        plan_ids = list({s.plan_id for s in subscriptions if s.plan_id})

        user_map = {}
        if user_ids:
            res = await self.session.execute(select(User).where(User.id.in_(user_ids)))
            for u in res.scalars().all():
                user_map[u.id] = {
                    "id": u.id,
                    "full_name": u.full_name,
                    "email": u.email,
                    "phone": u.phone
                }
        
        plan_map = {}
        if plan_ids:
            res = await self.session.execute(select(SubscriptionPlan).where(SubscriptionPlan.id.in_(plan_ids)))
            for p in res.scalars().all():
                plan_map[p.id] = p
        
        for s in subscriptions:
            s.user = user_map.get(s.user_id)
            s.plan = plan_map.get(s.plan_id)
            
        return subscriptions

    async def subscribe(self, user, plan_id: str) -> dict:
        return await self.payment_service.create_subscription_checkout(user=user, plan_id=plan_id)

    async def get_subscription(self, subscription_id: str) -> Subscription:
        subscription = await self.subscription_repository.get_by_id(subscription_id)
        if not subscription:
            raise NotFoundException("Subscription not found")
        enriched = await self._enrich_subscriptions([subscription])
        return enriched[0]

    async def get_my_subscription(self, user_id: str) -> Optional[Subscription]:
        sub = await self.subscription_repository.get_active_by_user(user_id)
        if sub:
            enriched = await self._enrich_subscriptions([sub])
            return enriched[0]
        return None

    async def list_history(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Subscription], int]:
        subs, total = await self.subscription_repository.list_by_user(user_id, page=page, page_size=page_size)
        enriched = await self._enrich_subscriptions(subs)
        return enriched, total

    async def list_subscriptions(
        self,
        status: Optional[str] = None,
        user_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Subscription], int]:
        status_enum = SubscriptionStatus(status) if status else None
        subs, total = await self.subscription_repository.list_all(
            status=status_enum,
            user_id=user_id,
            page=page,
            page_size=page_size,
        )
        enriched = await self._enrich_subscriptions(subs)
        return enriched, total

    async def admin_create_subscription(
        self,
        user_id: str,
        plan_id: str,
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        starts_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
    ) -> Subscription:
        plan_repo = SubscriptionPlanRepository(self.session)
        plan = await plan_repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundException("Subscription plan not found")

        now = datetime.now(timezone.utc)
        if starts_at is None:
            starts_at = now
        if expires_at is None:
            expires_at = starts_at + timedelta(days=plan.duration_days)

        sub = await self.subscription_repository.create(
            user_id=user_id,
            plan_id=plan_id,
            status=status,
            starts_at=starts_at,
            expires_at=expires_at,
        )
        enriched = await self._enrich_subscriptions([sub])
        return enriched[0]

    async def admin_update_subscription(
        self,
        subscription_id: str,
        status: Optional[SubscriptionStatus] = None,
        starts_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
    ) -> Subscription:
        subscription = await self.get_subscription(subscription_id)
        updated = await self.subscription_repository.update(
            subscription,
            status=status,
            starts_at=starts_at,
            expires_at=expires_at,
        )
        enriched = await self._enrich_subscriptions([updated])
        return enriched[0]

    async def admin_renew_subscription(self, subscription_id: str) -> Subscription:
        subscription = await self.get_subscription(subscription_id)
        plan_repo = SubscriptionPlanRepository(self.session)
        plan = await plan_repo.get_by_id(subscription.plan_id)
        if not plan:
            raise NotFoundException("Subscription plan not found")

        now = datetime.now(timezone.utc)
        # If expired already, renew from now; else extend from current expiry
        base = subscription.expires_at if subscription.expires_at and subscription.expires_at > now else now
        new_expires = base + timedelta(days=plan.duration_days)

        renewed = await self.subscription_repository.activate(
            subscription,
            starts_at=subscription.starts_at or now,
            expires_at=new_expires,
        )
        enriched = await self._enrich_subscriptions([renewed])
        return enriched[0]

    async def admin_cancel_subscription(self, subscription_id: str) -> Subscription:
        subscription = await self.get_subscription(subscription_id)
        if subscription.status == SubscriptionStatus.CANCELLED:
            raise BusinessException("Subscription is already cancelled")
        cancelled = await self.subscription_repository.update(
            subscription,
            status=SubscriptionStatus.CANCELLED,
        )
        enriched = await self._enrich_subscriptions([cancelled])
        return enriched[0]
