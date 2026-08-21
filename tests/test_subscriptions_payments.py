import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock

from app.common.enums import (
    BillingCycle,
    PaymentStatus,
    SubscriberType,
    SubscriptionStatus,
    UserRole,
)
from app.core.exceptions import BusinessException
from app.modules.payments.service import PaymentService
from app.modules.subscription_plans.schemas import SubscriptionPlanCreate
from app.modules.subscription_plans.service import SubscriptionPlanService
from app.modules.subscriptions.service import SubscriptionService
from app.modules.users.schemas import UserCreate
from app.modules.users.service import UserService


class FakeMoyasar:
    def __init__(self, status: str = "initiated"):
        self.status = status
        self.created = []
        self.verified = []

    async def create_payment(self, **kwargs):
        payload = {
            "id": f"inv_{len(self.created) + 1}",
            "status": self.status,
            "amount": 1000,
            "currency": kwargs.get("currency", "SAR"),
            "url": f"https://checkout.moyasar.com/invoices/inv_{len(self.created) + 1}",
            "metadata": kwargs.get("metadata", {}),
        }
        self.created.append(payload)
        return payload

    async def verify_payment(self, moyasar_payment_id: str):
        self.verified.append(moyasar_payment_id)
        return {
            "id": moyasar_payment_id,
            "status": self.status,
            "amount": 1000,
            "currency": "SAR",
            "source": {"type": "creditcard", "company": "visa"},
            "metadata": {
                "user_id": "u1",
                "subscription_id": "s1",
                "plan_id": "p1",
            },
        }


async def _create_customer(session, email="customer@example.com"):
    return await UserService(session).create_user(
        UserCreate(
            role=UserRole.CUSTOMER,
            full_name="Customer User",
            email=email,
            phone="+966500000001",
            password="Password123!",
        )
    )


async def _create_plan(session, **overrides):
    data = {
        "name": "Customer Monthly",
        "description": "Monthly plan",
        "subscriber_type": SubscriberType.CUSTOMER,
        "billing_cycle": BillingCycle.MONTHLY,
        "price": Decimal("10.00"),
        "currency": "SAR",
        "duration_days": 30,
        "is_active": True,
    }
    data.update(overrides)
    return await SubscriptionPlanService(session).create_plan(SubscriptionPlanCreate(**data))


@pytest.mark.asyncio
async def test_create_plan(test_session):
    plan = await _create_plan(test_session)
    assert plan.id is not None
    assert plan.subscriber_type == SubscriberType.CUSTOMER
    assert plan.billing_cycle == BillingCycle.MONTHLY
    assert float(plan.price) == 10.0


@pytest.mark.asyncio
async def test_list_plans(test_session):
    await _create_plan(test_session, name="Plan A")
    await _create_plan(
        test_session,
        name="Owner Annual",
        subscriber_type=SubscriberType.CAFE_OWNER,
        billing_cycle=BillingCycle.ANNUAL,
        duration_days=365,
        price=Decimal("100.00"),
    )
    plans, total = await SubscriptionPlanService(test_session).list_plans(is_active=True)
    assert total == 2
    assert len(plans) == 2

    customer_plans, customer_total = await SubscriptionPlanService(test_session).list_plans(
        is_active=True,
        subscriber_type=SubscriberType.CUSTOMER,
    )
    assert customer_total == 1
    assert customer_plans[0].subscriber_type == SubscriberType.CUSTOMER


@pytest.mark.asyncio
async def test_subscribe_creates_payment(test_session):
    user = await _create_customer(test_session)
    plan = await _create_plan(test_session)
    fake = FakeMoyasar(status="initiated")

    result = await PaymentService(test_session, moyasar=fake).create_subscription_checkout(
        user=user,
        plan_id=plan.id,
    )

    assert result["subscription_id"]
    assert result["payment_id"]
    assert result["payment_url"].startswith("https://checkout.moyasar.com/")
    assert len(fake.created) == 1
    assert fake.created[0]["metadata"]["user_id"] == user.id
    assert fake.created[0]["metadata"]["plan_id"] == plan.id


@pytest.mark.asyncio
async def test_subscribe_rejects_wrong_subscriber_type(test_session):
    user = await _create_customer(test_session)
    plan = await _create_plan(
        test_session,
        name="Owner Only",
        subscriber_type=SubscriberType.CAFE_OWNER,
        billing_cycle=BillingCycle.MONTHLY,
        duration_days=30,
    )
    fake = FakeMoyasar()
    with pytest.raises(BusinessException):
        await PaymentService(test_session, moyasar=fake).create_subscription_checkout(
            user=user,
            plan_id=plan.id,
        )


@pytest.mark.asyncio
async def test_webhook_success_activates_subscription(test_session):
    user = await _create_customer(test_session)
    plan = await _create_plan(test_session)
    fake = FakeMoyasar(status="initiated")
    payment_service = PaymentService(test_session, moyasar=fake)

    checkout = await payment_service.create_subscription_checkout(user=user, plan_id=plan.id)
    moyasar_id = fake.created[0]["id"]

    # Switch fake to paid for verification
    fake.status = "paid"
    fake.verify_payment = AsyncMock(
        return_value={
            "id": moyasar_id,
            "status": "paid",
            "amount": 1000,
            "currency": "SAR",
            "source": {"type": "creditcard"},
            "metadata": {
                "user_id": user.id,
                "subscription_id": checkout["subscription_id"],
                "plan_id": plan.id,
            },
        }
    )

    from app.core.config import settings as app_settings

    result = await payment_service.process_webhook(
        {
            "id": moyasar_id,
            "status": "paid",
            "secret_token": app_settings.moyasar_webhook_secret or "test",
            "metadata": {
                "user_id": user.id,
                "subscription_id": checkout["subscription_id"],
                "plan_id": plan.id,
            },
        }
    )
    assert result["status"] == "activated"

    subscription = await SubscriptionService(test_session).get_subscription(checkout["subscription_id"])
    assert subscription.status == SubscriptionStatus.ACTIVE
    assert subscription.starts_at is not None
    assert subscription.expires_at is not None
    assert subscription.expires_at > subscription.starts_at

    from app.modules.payments.repository import PaymentRepository

    payment = await PaymentRepository(test_session).get_by_id(checkout["payment_id"])
    assert payment.status == PaymentStatus.PAID


@pytest.mark.asyncio
async def test_webhook_failure_does_not_activate(test_session):
    user = await _create_customer(test_session)
    plan = await _create_plan(test_session)
    fake = FakeMoyasar(status="initiated")
    payment_service = PaymentService(test_session, moyasar=fake)

    checkout = await payment_service.create_subscription_checkout(user=user, plan_id=plan.id)
    moyasar_id = fake.created[0]["id"]

    fake.verify_payment = AsyncMock(
        return_value={
            "id": moyasar_id,
            "status": "failed",
            "amount": 1000,
            "currency": "SAR",
            "source": {"type": "creditcard"},
            "metadata": {
                "user_id": user.id,
                "subscription_id": checkout["subscription_id"],
                "plan_id": plan.id,
            },
        }
    )

    from app.core.config import settings as app_settings

    result = await payment_service.process_webhook(
        {
            "id": moyasar_id,
            "status": "failed",
            "secret_token": app_settings.moyasar_webhook_secret or "test",
        }
    )
    assert result["status"] == "failed"

    subscription = await SubscriptionService(test_session).get_subscription(checkout["subscription_id"])
    assert subscription.status == SubscriptionStatus.PENDING

    from app.modules.payments.repository import PaymentRepository

    payment = await PaymentRepository(test_session).get_by_id(checkout["payment_id"])
    assert payment.status == PaymentStatus.FAILED


@pytest.mark.asyncio
async def test_subscription_activation_duration(test_session):
    user = await _create_customer(test_session)
    plan = await _create_plan(test_session, duration_days=45)
    fake = FakeMoyasar(status="initiated")
    payment_service = PaymentService(test_session, moyasar=fake)
    checkout = await payment_service.create_subscription_checkout(user=user, plan_id=plan.id)
    moyasar_id = fake.created[0]["id"]

    fake.verify_payment = AsyncMock(
        return_value={
            "id": moyasar_id,
            "status": "paid",
            "amount": 1000,
            "currency": "SAR",
            "source": {},
            "metadata": {
                "subscription_id": checkout["subscription_id"],
                "user_id": user.id,
                "plan_id": plan.id,
            },
        }
    )
    from app.core.config import settings as app_settings

    await payment_service.process_webhook(
        {"id": moyasar_id, "secret_token": app_settings.moyasar_webhook_secret or "test"}
    )

    subscription = await SubscriptionService(test_session).get_subscription(checkout["subscription_id"])
    delta = subscription.expires_at - subscription.starts_at
    assert delta.days == 45


@pytest.mark.asyncio
async def test_my_subscription_and_history(test_session):
    user = await _create_customer(test_session)
    plan = await _create_plan(test_session)
    fake = FakeMoyasar(status="initiated")
    payment_service = PaymentService(test_session, moyasar=fake)
    checkout = await payment_service.create_subscription_checkout(user=user, plan_id=plan.id)

    service = SubscriptionService(test_session)
    assert await service.get_my_subscription(user.id) is None

    history, total = await service.list_history(user.id)
    assert total == 1
    assert history[0].id == checkout["subscription_id"]
    assert history[0].status == SubscriptionStatus.PENDING
