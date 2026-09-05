import pytest
from datetime import datetime, timezone, timedelta
from app.common.enums import UserRole, UserStatus, PagePermission, ComplaintStatus, SubscriptionStatus, SubscriberType, BillingCycle
from app.modules.users.service import UserService
from app.modules.users.schemas import UserCreate
from app.modules.admins.service import AdminService
from app.modules.admins.schemas import AdminCreate, AdminUpdate
from app.modules.cafes.service import CafeService
from app.modules.cafes.schemas import CafeCreate
from app.modules.products.service import ProductService
from app.modules.products.schemas import ProductCreate
from app.modules.offers.service import OfferService
from app.modules.offers.schemas import OfferCreate
from app.modules.events.service import EventService
from app.modules.events.schemas import EventCreate
from app.modules.complaints.service import ComplaintService
from app.modules.complaints.schemas import ComplaintCreate
from app.modules.subscription_plans.service import SubscriptionPlanService
from app.modules.subscription_plans.schemas import SubscriptionPlanCreate
from app.modules.subscriptions.service import SubscriptionService


@pytest.mark.asyncio
async def test_user_service_list_all_filtered_by_role(test_session):
    service = UserService(test_session)

    await service.create_user(UserCreate(
        role=UserRole.CUSTOMER,
        full_name="Customer 1",
        email="cust1@example.com",
        password="Password123!"
    ))
    await service.create_user(UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Owner 1",
        email="owner1@example.com",
        password="Password123!"
    ))

    customers, total_customers = await service.list_all_users(role="CUSTOMER")
    assert any(u.email == "cust1@example.com" for u in customers)
    assert not any(u.email == "owner1@example.com" for u in customers)

    owners, total_owners = await service.list_all_users(role="CAFE_OWNER")
    assert any(u.email == "owner1@example.com" for u in owners)
    assert not any(u.email == "cust1@example.com" for u in owners)


@pytest.mark.asyncio
async def test_admin_service_create_with_page_permissions(test_session):
    admin_service = AdminService(test_session)

    admin = await admin_service.create_admin(
        AdminCreate(
            full_name="Sub Admin",
            email="subadmin@example.com",
            password="Password123!",
            pages=[PagePermission.DASHBOARD, PagePermission.CAFES, PagePermission.CUSTOMERS]
        ),
        creator_role=UserRole.SUPER_ADMIN
    )

    assert admin.id is not None
    assert admin.pages is not None
    assert set(admin.pages) == {PagePermission.DASHBOARD.value, PagePermission.CAFES.value, PagePermission.CUSTOMERS.value}

    fetched = await admin_service.get_admin(admin.id)
    assert set(fetched.pages) == {PagePermission.DASHBOARD.value, PagePermission.CAFES.value, PagePermission.CUSTOMERS.value}


@pytest.mark.asyncio
async def test_admin_service_update_permissions_and_password(test_session):
    admin_service = AdminService(test_session)

    admin = await admin_service.create_admin(
        AdminCreate(
            full_name="Staff Admin",
            email="staff@example.com",
            password="Password123!",
            pages=[PagePermission.DASHBOARD]
        ),
        creator_role=UserRole.SUPER_ADMIN
    )

    updated = await admin_service.update_admin(
        admin.id,
        AdminUpdate(
            full_name="Staff Admin Updated",
            password="NewPassword123!",
            pages=[PagePermission.OFFERS, PagePermission.PRODUCTS]
        ),
        updater_role=UserRole.SUPER_ADMIN,
        updater_id="super-admin-id"
    )

    assert updated.full_name == "Staff Admin Updated"
    assert set(updated.pages) == {PagePermission.OFFERS.value, PagePermission.PRODUCTS.value}


@pytest.mark.asyncio
async def test_product_offer_event_creation_and_search(test_session):
    user_service = UserService(test_session)
    owner = await user_service.create_user(UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Cafe Owner Test",
        email="poe_owner@example.com",
        password="Password123!"
    ))

    cafe_service = CafeService(test_session)
    cafe = await cafe_service.create_cafe(
        CafeCreate(name="Al-Masa Cafe", description="Specialty coffee", address="Riyadh"),
        owner_id=owner.id
    )

    # Products
    product_service = ProductService(test_session)
    product = await product_service.create_product(ProductCreate(
        cafe_id=cafe.id,
        name="Latte Art",
        name_en="Latte Art EN",
        description="Fresh latte",
        price=18.50,
        image_url="https://example.com/latte.jpg"
    ))
    assert product.id is not None
    products, total_prod = await product_service.list_all_products(search="Latte", cafe_id=cafe.id)
    assert total_prod >= 1
    assert any(p.id == product.id for p in products)

    # Offers
    offer_service = OfferService(test_session)
    now = datetime.now(timezone.utc)
    offer = await offer_service.create_offer(OfferCreate(
        cafe_id=cafe.id,
        title="20% Weekend Coffee",
        description="Weekend discount",
        discount_percentage=20,
        image_url="https://example.com/offer.jpg",
        start_date=now,
        end_date=now + timedelta(days=7)
    ))
    assert offer.id is not None
    offers, total_off = await offer_service.list_all_offers(search="Weekend", cafe_id=cafe.id)
    assert total_off >= 1
    assert any(o.id == offer.id for o in offers)

    # Events
    event_service = EventService(test_session)
    event = await event_service.create_event(EventCreate(
        cafe_id=cafe.id,
        title="Coffee Tasting Workshop",
        description="Learn brewing methods",
        location="Main Branch Riyadh",
        image_url="https://example.com/event.jpg",
        event_date=now + timedelta(days=14)
    ))
    assert event.id is not None
    assert event.image_url == "https://example.com/event.jpg"
    events, total_ev = await event_service.list_all_events(search="Tasting", cafe_id=cafe.id)
    assert total_ev >= 1
    assert any(e.id == event.id for e in events)


@pytest.mark.asyncio
async def test_complaints_enrichment(test_session):
    user_service = UserService(test_session)
    customer = await user_service.create_user(UserCreate(
        role=UserRole.CUSTOMER,
        full_name="Fatima Al-Otaibi",
        email="fatima@example.com",
        phone="+966500000001",
        password="Password123!"
    ))
    owner = await user_service.create_user(UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Cafe Owner 2",
        email="owner2@example.com",
        password="Password123!"
    ))

    cafe_service = CafeService(test_session)
    cafe = await cafe_service.create_cafe(
        CafeCreate(name="Caribou Cafe", description="Cozy place", address="Jeddah"),
        owner_id=owner.id
    )

    complaint_service = ComplaintService(test_session)
    complaint = await complaint_service.create_complaint(ComplaintCreate(
        customer_id=customer.id,
        cafe_id=cafe.id,
        subject="Delay in preparation",
        description="Wait time was over 30 minutes."
    ))

    assert complaint.id is not None
    assert complaint.customer is not None
    assert complaint.customer["full_name"] == "Fatima Al-Otaibi"
    assert complaint.cafe is not None
    assert complaint.cafe["name"] == "Caribou Cafe"

    complaints, total = await complaint_service.list_all_complaints()
    c = next(item for item in complaints if item.id == complaint.id)
    assert c.customer["full_name"] == "Fatima Al-Otaibi"
    assert c.cafe["name"] == "Caribou Cafe"


@pytest.mark.asyncio
async def test_subscriptions_enrichment(test_session):
    user_service = UserService(test_session)
    owner = await user_service.create_user(UserCreate(
        role=UserRole.CAFE_OWNER,
        full_name="Tariq Mansoor",
        email="tariq@example.com",
        password="Password123!"
    ))

    plan_service = SubscriptionPlanService(test_session)
    plan = await plan_service.create_plan(SubscriptionPlanCreate(
        name="Business Annual Tier",
        subscriber_type=SubscriberType.CAFE_OWNER,
        billing_cycle=BillingCycle.ANNUAL,
        price=599.00,
        currency="SAR",
        duration_days=365
    ))

    sub_service = SubscriptionService(test_session)
    sub = await sub_service.admin_create_subscription(
        user_id=owner.id,
        plan_id=plan.id,
        status=SubscriptionStatus.ACTIVE
    )

    assert sub.id is not None
    assert sub.user is not None
    assert sub.user["full_name"] == "Tariq Mansoor"
    assert sub.plan is not None
    assert sub.plan.name == "Business Annual Tier"

    subs, total = await sub_service.list_subscriptions()
    found = next(item for item in subs if item.id == sub.id)
    assert found.user["full_name"] == "Tariq Mansoor"
    assert found.plan.price == 599.00
