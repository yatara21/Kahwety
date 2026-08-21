from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.subscription_plans.repository import SubscriptionPlanRepository
from app.modules.subscription_plans.schemas import SubscriptionPlanCreate, SubscriptionPlanUpdate
from app.modules.subscription_plans.models import SubscriptionPlan
from app.core.exceptions import NotFoundException, BusinessException
from app.common.enums import SubscriberType, BillingCycle


class SubscriptionPlanService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.plan_repository = SubscriptionPlanRepository(session)

    async def create_plan(self, plan_create: SubscriptionPlanCreate) -> SubscriptionPlan:
        if plan_create.billing_cycle == BillingCycle.MONTHLY and plan_create.duration_days < 28:
            raise BusinessException("MONTHLY plans should have duration_days >= 28")
        if plan_create.billing_cycle == BillingCycle.ANNUAL and plan_create.duration_days < 365:
            raise BusinessException("ANNUAL plans should have duration_days >= 365")
        return await self.plan_repository.create(plan_create)

    async def get_plan(self, plan_id: str) -> SubscriptionPlan:
        plan = await self.plan_repository.get_by_id(plan_id)
        if not plan:
            raise NotFoundException("Subscription plan not found")
        return plan

    async def list_plans(
        self,
        is_active: Optional[bool] = None,
        subscriber_type: Optional[SubscriberType | str] = None,
        billing_cycle: Optional[BillingCycle | str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[SubscriptionPlan], int]:
        return await self.plan_repository.list_all(
            is_active=is_active,
            subscriber_type=subscriber_type,
            billing_cycle=billing_cycle,
            page=page,
            page_size=page_size,
        )

    async def update_plan(self, plan_id: str, plan_update: SubscriptionPlanUpdate) -> SubscriptionPlan:
        plan = await self.get_plan(plan_id)
        return await self.plan_repository.update(plan, plan_update)

    async def activate_plan(self, plan_id: str) -> SubscriptionPlan:
        plan = await self.get_plan(plan_id)
        return await self.plan_repository.set_active(plan, True)

    async def deactivate_plan(self, plan_id: str) -> SubscriptionPlan:
        plan = await self.get_plan(plan_id)
        return await self.plan_repository.set_active(plan, False)

    async def delete_plan(self, plan_id: str) -> None:
        plan = await self.get_plan(plan_id)
        await self.plan_repository.delete(plan)
