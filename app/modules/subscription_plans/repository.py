from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from app.modules.subscription_plans.models import SubscriptionPlan
from app.modules.subscription_plans.schemas import SubscriptionPlanCreate, SubscriptionPlanUpdate
from app.common.enums import SubscriberType, BillingCycle


class SubscriptionPlanRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, plan_create: SubscriptionPlanCreate) -> SubscriptionPlan:
        plan = SubscriptionPlan(
            name=plan_create.name,
            description=plan_create.description,
            subscriber_type=plan_create.subscriber_type,
            billing_cycle=plan_create.billing_cycle,
            price=float(plan_create.price),
            currency=plan_create.currency.upper(),
            duration_days=plan_create.duration_days,
            is_active=plan_create.is_active,
        )
        self.session.add(plan)
        await self.session.flush()
        await self.session.refresh(plan)
        return plan

    async def get_by_id(self, plan_id: str) -> Optional[SubscriptionPlan]:
        result = await self.session.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        is_active: Optional[bool] = None,
        subscriber_type: Optional[SubscriberType | str] = None,
        billing_cycle: Optional[BillingCycle | str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[SubscriptionPlan], int]:
        query = select(SubscriptionPlan)

        if is_active is not None:
            query = query.where(SubscriptionPlan.is_active == is_active)
        if subscriber_type is not None:
            query = query.where(SubscriptionPlan.subscriber_type == subscriber_type)
        if billing_cycle is not None:
            query = query.where(SubscriptionPlan.billing_cycle == billing_cycle)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(SubscriptionPlan.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.session.execute(query)
        plans = result.scalars().all()
        return list(plans), total

    async def update(self, plan: SubscriptionPlan, plan_update: SubscriptionPlanUpdate) -> SubscriptionPlan:
        data = plan_update.model_dump(exclude_unset=True)
        if "currency" in data and data["currency"] is not None:
            data["currency"] = data["currency"].upper()
        if "price" in data and data["price"] is not None:
            data["price"] = float(data["price"])
        for field, value in data.items():
            setattr(plan, field, value)
        await self.session.flush()
        await self.session.refresh(plan)
        return plan

    async def set_active(self, plan: SubscriptionPlan, is_active: bool) -> SubscriptionPlan:
        plan.is_active = is_active
        await self.session.flush()
        await self.session.refresh(plan)
        return plan

    async def delete(self, plan: SubscriptionPlan) -> None:
        await self.session.delete(plan)
        await self.session.flush()
