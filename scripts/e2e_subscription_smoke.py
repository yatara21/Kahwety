"""End-to-end smoke: create plan + subscribe via services with real Moyasar."""
import asyncio
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.common.enums import BillingCycle, SubscriberType, UserRole
from app.core.config import settings
from app.modules.payments.service import PaymentService
from app.modules.subscription_plans.schemas import SubscriptionPlanCreate
from app.modules.subscription_plans.service import SubscriptionPlanService
from app.modules.users.schemas import UserCreate
from app.modules.users.service import UserService


async def main() -> None:
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as session:
        users = UserService(session)
        try:
            user = await users.create_user(
                UserCreate(
                    role=UserRole.CUSTOMER,
                    full_name="Live Pay User",
                    email="live.pay.user@example.com",
                    phone="+966511122233",
                    password="Password123!",
                )
            )
        except Exception:
            from sqlalchemy import select
            from app.modules.users.models import User

            result = await session.execute(select(User).where(User.email == "live.pay.user@example.com"))
            user = result.scalar_one()

        plans = SubscriptionPlanService(session)
        plan = await plans.create_plan(
            SubscriptionPlanCreate(
                name=f"Live Test Plan {asyncio.get_event_loop().time():.0f}",
                description="1 SAR live checkout test",
                subscriber_type=SubscriberType.CUSTOMER,
                billing_cycle=BillingCycle.MONTHLY,
                price=Decimal("1.00"),
                currency="SAR",
                duration_days=30,
                is_active=True,
            )
        )

        checkout = await PaymentService(session).create_subscription_checkout(
            user=user,
            plan_id=plan.id,
        )
        await session.commit()

        print("subscription_id:", checkout["subscription_id"])
        print("payment_id:", checkout["payment_id"])
        print("payment_url:", checkout["payment_url"])
        print("Open payment_url in a browser to complete a real 1 SAR payment.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
