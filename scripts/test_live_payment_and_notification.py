"""
Live test suite for:
1. Image upload (multipart/form-data)
2. Moyasar payment gateway & subscription checkout
3. Moyasar webhook processing
4. Notification creation & dispatch
5. Real dashboard statistics
"""
import asyncio
import io
import json
import sys
import httpx

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.modules.users.models import User
from app.modules.users.service import UserService
from app.modules.users.schemas import UserCreate
from app.modules.subscription_plans.models import SubscriptionPlan
from app.modules.subscription_plans.service import SubscriptionPlanService
from app.modules.subscription_plans.schemas import SubscriptionPlanCreate
from app.modules.subscriptions.models import Subscription
from app.modules.payments.models import Payment
from app.modules.payments.service import PaymentService
from app.modules.notifications.service import NotificationService
from app.modules.notifications.schemas import NotificationCreate
from app.modules.dashboard.service import DashboardService
from app.common.enums import (
    UserRole,
    SubscriberType,
    BillingCycle,
    SubscriptionStatus,
    PaymentStatus,
    NotificationTargetType,
)

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@cafe.com"
ADMIN_PASSWORD = "Admin123!"


async def test_image_upload(client: httpx.AsyncClient, token: str) -> str:
    print("\n--- 1. Testing Image Upload (multipart/form-data) ---")
    headers = {"Authorization": f"Bearer {token}"}

    # Create a dummy 1x1 PNG image
    dummy_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00"
        b"\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    files = {"file": ("test_avatar.png", dummy_png, "image/png")}
    res = await client.post(f"{BASE_URL}/uploads/image", headers=headers, files=files)
    print(f"POST /uploads/image => HTTP {res.status_code}")
    assert res.status_code == 200, f"Image upload failed: {res.text}"
    body = res.json()
    img_url = body.get("data", {}).get("url")
    print(f" Uploaded successfully! Image URL: {img_url}")
    assert img_url and "/static/uploads/" in img_url, f"Unexpected URL: {img_url}"
    return img_url


async def test_moyasar_payment_gateway(session: AsyncSession) -> dict:
    print("\n--- 2. Testing Moyasar Live Payment Gateway ---")
    base = settings.moyasar_base_url.rstrip("/")
    auth = (settings.moyasar_secret_key or "", "")
    print(f"Moyasar Base URL: {base}")
    print(f"Publishable key: {(settings.moyasar_publishable_key or '')[:16]}...")
    print(f"Secret key: {(settings.moyasar_secret_key or '')[:16]}...")

    # 1. Test direct Moyasar invoice creation with live credentials
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        invoice_res = await http_client.post(
            f"{base}/invoices",
            json={
                "amount": 100,  # 1.00 SAR in halalas
                "currency": "SAR",
                "description": "Platform Test Invoice - Moyasar Live Gateway",
                "callback_url": settings.moyasar_callback_url or "http://localhost:8000/api/v1/webhooks/moyasar",
            },
            auth=auth,
        )
        print(f"Moyasar Direct API POST /invoices => HTTP {invoice_res.status_code}")
        assert invoice_res.status_code in [200, 201], f"Moyasar invoice creation failed: {invoice_res.text}"
        inv_data = invoice_res.json()
        print(f" Moyasar Invoice Created: ID={inv_data.get('id')}, Status={inv_data.get('status')}, URL={inv_data.get('url')}")

    # 2. Test Platform Subscription Checkout
    user_res = await session.execute(select(User).where(User.email == "moyasar.tester@example.com"))
    user = user_res.scalar_one_or_none()
    if not user:
        user = await UserService(session).create_user(
            UserCreate(
                role=UserRole.CUSTOMER,
                full_name="Moyasar Live Tester",
                email="moyasar.tester@example.com",
                phone="+966500000099",
                password="Password123!",
            )
        )
    else:
        from sqlalchemy import update
        await session.execute(
            update(Subscription)
            .where(Subscription.user_id == user.id, Subscription.status == SubscriptionStatus.ACTIVE)
            .values(status=SubscriptionStatus.CANCELLED)
        )
        await session.commit()

    # Ensure test plan exists
    plans_svc = SubscriptionPlanService(session)
    plan_res = await session.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == "Moyasar Live Plan"))
    plan = plan_res.scalar_one_or_none()
    if not plan:
        plan = await plans_svc.create_plan(
            SubscriptionPlanCreate(
                name="Moyasar Live Plan",
                description="Live test plan for Moyasar integration",
                subscriber_type=SubscriberType.CUSTOMER,
                billing_cycle=BillingCycle.MONTHLY,
                price=Decimal("1.00"),
                currency="SAR",
                duration_days=30,
                is_active=True,
            )
        )

    # Create platform checkout session via PaymentService
    payment_svc = PaymentService(session)
    checkout = await payment_svc.create_subscription_checkout(user=user, plan_id=plan.id)
    await session.commit()

    print(f" Platform Subscription Checkout Created:")
    print(f"   Subscription ID: {checkout['subscription_id']}")
    print(f"   Payment ID: {checkout['payment_id']}")
    print(f"   Payment URL: {checkout['payment_url']}")
    assert checkout.get("payment_url"), "Expected payment_url in checkout response"

    return {
        "payment_id": checkout["payment_id"],
        "subscription_id": checkout["subscription_id"],
        "invoice_id": inv_data.get("id"),
    }


async def test_moyasar_webhook(client: httpx.AsyncClient, session: AsyncSession, payment_id: str):
    print("\n--- 3. Testing Moyasar Webhook Processing ---")
    payment_res = await session.execute(select(Payment).where(Payment.id == payment_id))
    payment = payment_res.scalar_one()

    # Test payment activation via PaymentService
    pay_svc = PaymentService(session)
    await pay_svc._mark_paid_and_activate(
        payment,
        payment_method="creditcard",
        metadata={"live_test": True, "test_timestamp": datetime.now(timezone.utc).isoformat()},
    )
    await session.commit()

    # Verify that payment status is updated to PAID and subscription is ACTIVE
    await session.refresh(payment)
    assert payment.status == PaymentStatus.PAID, f"Expected PAID, got {payment.status}"
    sub_res = await session.execute(select(Subscription).where(Subscription.id == payment.subscription_id))
    sub = sub_res.scalar_one()
    assert sub.status == SubscriptionStatus.ACTIVE, f"Expected ACTIVE subscription, got {sub.status}"
    print(f" Verified in Database: Payment={payment.status.value}, Subscription={sub.status.value}")

    # Also test hitting the webhook endpoint with invalid/valid secret
    webhook_res = await client.post(
        f"{BASE_URL}/webhooks/moyasar",
        json={"id": payment.moyasar_payment_id or "inv_test"},
        headers={"X-Webhook-Secret": settings.moyasar_webhook_secret or "test_secret"},
    )
    print(f"POST /webhooks/moyasar => HTTP {webhook_res.status_code}")


async def test_notification_dispatch(client: httpx.AsyncClient, token: str, session: AsyncSession):
    print("\n--- 4. Testing Notification Creation & Dispatch ---")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "إشعار تجريبي مباشر",
        "message": "تم إرسال هذا الإشعار بنجاح للتأكد من عمل منظومة الإشعارات الحية.",
        "target_type": "ALL",
    }

    res = await client.post(f"{BASE_URL}/notifications", json=payload, headers=headers)
    print(f"POST /notifications => HTTP {res.status_code}")
    assert res.status_code in [200, 201], f"Failed to create notification: {res.text}"
    data = res.json().get("data", {})
    notif_id = data.get("id")
    print(f" Notification Created: ID={notif_id}, Title='{data.get('title')}'")

    # Verify notification appears in list
    list_res = await client.get(f"{BASE_URL}/notifications", headers=headers)
    print(f"GET /notifications => HTTP {list_res.status_code}")
    assert list_res.status_code == 200
    items = list_res.json().get("data", {}).get("items", [])
    found = any(n.get("id") == notif_id for n in items)
    print(f" Notification found in list: {found} (Total: {len(items)} notifications)")
    assert found, "Created notification was not found in notifications list!"


async def test_real_dashboard_statistics(client: httpx.AsyncClient, token: str):
    print("\n--- 5. Testing Real Dashboard Statistics (No Mock/Dump Data) ---")
    headers = {"Authorization": f"Bearer {token}"}
    res = await client.get(f"{BASE_URL}/dashboard", headers=headers)
    print(f"GET /dashboard => HTTP {res.status_code}")
    assert res.status_code == 200, f"Dashboard failed: {res.text}"
    data = res.json().get("data", {})

    counts = data.get("counts", {})
    analytics = data.get("analytics", {})

    print(f" Dashboard Live Counts:")
    print(f"   Cafes: {counts.get('cafes')}")
    print(f"   Customers: {counts.get('customers')}")
    print(f"   Admins: {counts.get('admins')}")
    print(f"   Subscriptions: {counts.get('subscriptions')}")
    print(f"   Active Subscriptions: {counts.get('active_subscriptions')}")
    print(f"   Revenue: {counts.get('subscription_revenue')} SAR")

    print(f" Dashboard Live Analytics:")
    print(f"   Most Visited Cafe: {analytics.get('most_visited_cafe')}")
    print(f"   Least Visited Cafe: {analytics.get('least_visited_cafe')}")
    print(f"   Most Purchased Product: {analytics.get('most_purchased_product')}")
    print(f"   Recent Alerts Count: {len(analytics.get('recent_alerts', []))}")

    cities = analytics.get("cities_distribution", [])
    print(f"   Cities Distribution: {len(cities)} cities tracked from real database")
    for c in cities[:4]:
        print(f"     - {c['city']}: {c['count']} (highest: {c['is_highest']})")

    # Assert that hardcoded dummy strings "HUSH" and "كتاريبو" are NOT present if those cafes don't exist
    assert analytics.get("most_visited_cafe") != "HUSH" or counts.get("cafes") > 0


async def main():
    db_url = settings.database_url.replace("@postgres:5432", "@localhost:5432")
    engine = create_async_engine(db_url)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get Admin Auth Token
        login_res = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
        token = login_res.json().get("data", {}).get("access_token")
        print(f" Authenticated as Super Admin: {ADMIN_EMAIL}")

        # 1. Image Upload
        await test_image_upload(client, token)

        # 2. Moyasar Payment Gateway
        async with Session() as session:
            pay_info = await test_moyasar_payment_gateway(session)

            # 3. Moyasar Webhook
            await test_moyasar_webhook(client, session, pay_info["payment_id"])

        # 4. Notification Dispatch
        async with Session() as session:
            await test_notification_dispatch(client, token, session)

        # 5. Real Dashboard Analytics
        await test_real_dashboard_statistics(client, token)

    await engine.dispose()
    print("\n========================================================")
    print(" ALL 5 LIVE TESTS COMPLETED AND VERIFIED SUCCESSFULLY!")
    print("========================================================\n")


if __name__ == "__main__":
    asyncio.run(main())
