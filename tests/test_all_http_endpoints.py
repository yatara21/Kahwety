import pytest
from httpx import AsyncClient, ASGITransport
import uuid
from datetime import datetime, timezone, timedelta
from app.main import app
from app.core.database import get_async_session
from app.common.enums import UserRole, UserStatus
from app.modules.users.models import User
from app.core.security import get_password_hash


@pytest.fixture
def override_db(test_session):
    async def _get_test_session():
        yield test_session
    app.dependency_overrides[get_async_session] = _get_test_session
    yield test_session
    app.dependency_overrides.pop(get_async_session, None)


@pytest.mark.asyncio
async def test_all_api_endpoints_e2e(override_db, test_session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

        # 2. Seed a Super Admin directly in DB
        super_admin_id = str(uuid.uuid4())
        super_admin = User(
            id=super_admin_id,
            role=UserRole.SUPER_ADMIN,
            full_name="Super Admin",
            email="superadmin@test.com",
            password_hash=get_password_hash("SuperAdmin123!"),
            status=UserStatus.ACTIVE,
            email_verified=True,
            phone_verified=True,
        )
        test_session.add(super_admin)
        await test_session.commit()

        # 3. Super Admin Login
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "superadmin@test.com", "password": "SuperAdmin123!"}
        )
        assert login_res.status_code == 200
        login_data = login_res.json()["data"]
        sa_token = login_data["access_token"]
        refresh_token = login_data["refresh_token"]
        sa_headers = {"Authorization": f"Bearer {sa_token}"}

        # 4. Auth /me
        me_res = await client.get("/api/v1/auth/me", headers=sa_headers)
        assert me_res.status_code == 200
        assert me_res.json()["data"]["role"] == "SUPER_ADMIN"

        # 5. Token Refresh
        ref_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert ref_res.status_code == 200
        assert "access_token" in ref_res.json()["data"]

        # 6. Register Customer
        cust_email = f"customer_{uuid.uuid4().hex[:6]}@test.com"
        reg_cust_res = await client.post(
            "/api/v1/auth/register",
            json={
                "role": "CUSTOMER",
                "full_name": "Test Customer",
                "email": cust_email,
                "password": "Password123!",
                "phone": f"+9665{uuid.uuid4().int % 100000000:08d}"
            }
        )
        assert reg_cust_res.status_code in (200, 201)
        cust_token = reg_cust_res.json()["data"]["access_token"]
        cust_id = reg_cust_res.json()["data"]["user"]["id"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        # 7. Register Cafe Owner
        owner_email = f"owner_{uuid.uuid4().hex[:6]}@test.com"
        reg_owner_res = await client.post(
            "/api/v1/auth/register",
            json={
                "role": "CAFE_OWNER",
                "full_name": "Test Cafe Owner",
                "email": owner_email,
                "password": "Password123!",
                "phone": f"+9665{uuid.uuid4().int % 100000000:08d}"
            }
        )
        assert reg_owner_res.status_code in (200, 201)
        owner_token = reg_owner_res.json()["data"]["access_token"]
        owner_id = reg_owner_res.json()["data"]["user"]["id"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        # 8. Create Admin with permissions (Super Admin only)
        admin_email = f"admin_{uuid.uuid4().hex[:6]}@test.com"
        admin_res = await client.post(
            "/api/v1/admins",
            headers=sa_headers,
            json={
                "full_name": "Test Admin Officer",
                "email": admin_email,
                "password": "AdminPassword123!",
                "pages": ["Dashboard", "Cafes", "Customers", "Cafe Owners"]
            }
        )
        assert admin_res.status_code in (200, 201)

        # List Admins
        get_admins_res = await client.get("/api/v1/admins", headers=sa_headers)
        assert get_admins_res.status_code == 200
        assert len(get_admins_res.json()["data"]["items"]) >= 1

        # 9. List Users / Customers / Cafe Owners
        users_res = await client.get("/api/v1/users", headers=sa_headers)
        assert users_res.status_code == 200
        assert users_res.json()["data"]["total"] >= 3

        custs_res = await client.get("/api/v1/customers", headers=sa_headers)
        assert custs_res.status_code == 200

        owners_res = await client.get("/api/v1/cafe-owners", headers=sa_headers)
        assert owners_res.status_code == 200

        # 10. Image Upload
        fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        files = {"file": ("test.png", fake_png, "image/png")}
        upload_res = await client.post("/api/v1/uploads/image", headers=sa_headers, files=files)
        assert upload_res.status_code == 200
        uploaded_img_url = upload_res.json()["data"]["url"]

        # 11. Create Cafe (by Cafe Owner)
        cafe_res = await client.post(
            "/api/v1/cafes",
            headers=owner_headers,
            json={
                "name": "Roastery Alpha",
                "description": "Artisan coffee and pastries",
                "city": "Riyadh",
                "address": "King Fahd Rd, Riyadh",
                "latitude": 24.7136,
                "longitude": 46.6753,
                "logo_url": uploaded_img_url
            }
        )
        assert cafe_res.status_code in (200, 201)
        cafe_id = cafe_res.json()["data"]["id"]

        # Approve Cafe by Super Admin
        appr_res = await client.post(f"/api/v1/cafes/{cafe_id}/approve", headers=sa_headers)
        assert appr_res.status_code == 200

        # All Cafes (Admin list)
        all_cafes = await client.get("/api/v1/cafes", headers=sa_headers)
        assert all_cafes.status_code == 200
        assert len(all_cafes.json()["data"]["items"]) >= 1

        # 12. Branches
        branch_res = await client.post(
            "/api/v1/branches",
            headers=owner_headers,
            json={
                "cafe_id": cafe_id,
                "name": "Olaya Flagship Branch",
                "address": "Olaya St, Riyadh",
                "phone": "+966512345678",
                "latitude": 24.7140,
                "longitude": 46.6750
            }
        )
        assert branch_res.status_code in (200, 201)

        get_branches = await client.get(f"/api/v1/branches/cafe/{cafe_id}")
        assert get_branches.status_code == 200
        assert len(get_branches.json()["data"]) >= 1

        # 13. Products
        prod_res = await client.post(
            "/api/v1/products",
            headers=owner_headers,
            json={
                "cafe_id": cafe_id,
                "name": "Spanish Latte",
                "name_en": "Spanish Latte",
                "description": "Sweet espresso blend",
                "price": 24.0,
                "image_url": uploaded_img_url
            }
        )
        assert prod_res.status_code in (200, 201)

        get_prods = await client.get("/api/v1/products", headers=sa_headers)
        assert get_prods.status_code == 200
        assert get_prods.json()["data"]["total"] >= 1

        # 14. Offers
        offer_res = await client.post(
            "/api/v1/offers",
            headers=owner_headers,
            json={
                "cafe_id": cafe_id,
                "title": "Opening Discount 25%",
                "description": "All specialty drinks 25% off",
                "discount_percentage": 25,
                "start_date": "2026-09-01T00:00:00Z",
                "end_date": "2026-09-30T00:00:00Z"
            }
        )
        assert offer_res.status_code in (200, 201)

        get_offers = await client.get("/api/v1/offers", headers=sa_headers)
        assert get_offers.status_code == 200
        assert get_offers.json()["data"]["total"] >= 1

        # 15. Events
        event_res = await client.post(
            "/api/v1/events",
            headers=owner_headers,
            json={
                "cafe_id": cafe_id,
                "title": "Barista Brewing Masterclass",
                "description": "Learn manual pour-over techniques",
                "location": "Olaya Flagship Branch",
                "event_date": "2026-09-20T17:00:00Z"
            }
        )
        assert event_res.status_code in (200, 201)

        get_events = await client.get("/api/v1/events", headers=sa_headers)
        assert get_events.status_code == 200
        assert get_events.json()["data"]["total"] >= 1

        # 16. Complaints (Customer creates)
        comp_res = await client.post(
            "/api/v1/complaints",
            headers=cust_headers,
            json={
                "customer_id": cust_id,
                "cafe_id": cafe_id,
                "subject": "Order delayed",
                "description": "Waited 20 minutes for iced coffee."
            }
        )
        assert comp_res.status_code in (200, 201)

        get_comps = await client.get("/api/v1/complaints", headers=sa_headers)
        assert get_comps.status_code == 200
        assert get_comps.json()["data"]["total"] >= 1

        # 17. Subscription Plans & Subscriptions
        plan_res = await client.post(
            "/api/v1/admin/subscription-plans",
            headers=sa_headers,
            json={
                "name": "Cafe Owner Pro",
                "description": "Full access to platform features",
                "subscriber_type": "CAFE_OWNER",
                "billing_cycle": "MONTHLY",
                "price": 199.0,
                "currency": "SAR",
                "duration_days": 30
            }
        )
        assert plan_res.status_code in (200, 201)
        plan_id = plan_res.json()["data"]["id"]

        get_plans = await client.get("/api/v1/admin/subscription-plans", headers=sa_headers)
        assert get_plans.status_code == 200
        assert get_plans.json()["data"]["total"] >= 1

        now = datetime.now(timezone.utc)
        sub_res = await client.post(
            "/api/v1/admin/subscriptions",
            headers=sa_headers,
            json={
                "user_id": owner_id,
                "plan_id": plan_id,
                "status": "ACTIVE",
                "starts_at": now.isoformat(),
                "expires_at": (now + timedelta(days=30)).isoformat()
            }
        )
        assert sub_res.status_code in (200, 201)

        get_subs = await client.get("/api/v1/admin/subscriptions", headers=sa_headers)
        assert get_subs.status_code == 200
        assert get_subs.json()["data"]["total"] >= 1

        # Public Cafes & Nearby (now owner has active subscription)
        pub_cafes = await client.get("/api/v1/cafes/public")
        assert pub_cafes.status_code == 200
        assert len(pub_cafes.json()["data"]["items"]) >= 1

        nearby_res = await client.get("/api/v1/cafes/nearby?latitude=24.7136&longitude=46.6753&radius_km=10")
        assert nearby_res.status_code == 200

        # 18. Coupons
        coupon_res = await client.post(
            "/api/v1/coupons",
            headers=sa_headers,
            json={
                "code": "WELCOME50",
                "discount_percent": 50,
                "plan_id": plan_id,
                "max_uses": 100,
                "start_date": now.isoformat(),
                "end_date": (now + timedelta(days=30)).isoformat(),
                "is_active": True
            }
        )
        assert coupon_res.status_code in (200, 201)

        get_coupons = await client.get("/api/v1/coupons", headers=sa_headers)
        assert get_coupons.status_code == 200
        assert get_coupons.json()["data"]["total"] >= 1

        # 19. Notifications
        notif_res = await client.post(
            "/api/v1/notifications",
            headers=sa_headers,
            json={
                "title": "Welcome to Kahwety",
                "message": "Enjoy testing the platform!",
                "target_type": "ALL"
            }
        )
        assert notif_res.status_code in (200, 201)

        get_notifs = await client.get("/api/v1/notifications", headers=sa_headers)
        assert get_notifs.status_code == 200
        assert get_notifs.json()["data"]["total"] >= 1

        # 20. Suggested Cafes
        sug_res = await client.post(
            "/api/v1/suggested-cafes",
            headers=cust_headers,
            json={
                "owner_name": "Ahmed Al-Ghamdi",
                "city": "Jeddah",
                "phone": "+966500000099",
                "google_link": "https://maps.google.com/?q=suggested"
            }
        )
        assert sug_res.status_code in (200, 201)

        get_sugs = await client.get("/api/v1/suggested-cafes", headers=sa_headers)
        assert get_sugs.status_code == 200
        assert get_sugs.json()["data"]["total"] >= 1

        # 21. Map Endpoints
        map_res = await client.get("/api/v1/map/cafes")
        assert map_res.status_code == 200
        assert "markers" in map_res.json()["data"]

        # 22. Mobile Endpoints
        mob_cafes = await client.get("/api/v1/mobile/cafes")
        assert mob_cafes.status_code == 200

        mob_prods = await client.get(f"/api/v1/mobile/cafes/{cafe_id}/products")
        assert mob_prods.status_code == 200

        mob_offers = await client.get(f"/api/v1/mobile/cafes/{cafe_id}/offers")
        assert mob_offers.status_code == 200

        mob_events = await client.get(f"/api/v1/mobile/cafes/{cafe_id}/events")
        assert mob_events.status_code == 200

        mob_plans = await client.get("/api/v1/mobile/plans")
        assert mob_plans.status_code == 200

        # 23. Dashboard Analytics (Dashboard page permission / Super Admin)
        dash_res = await client.get("/api/v1/dashboard", headers=sa_headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()["data"]
        assert "counts" in dash_data
        assert "analytics" in dash_data
        counts = dash_data["counts"]
        assert counts.get("cafes", 0) >= 1
        assert counts.get("products", 0) >= 1
        assert counts.get("offers", 0) >= 1
        assert counts.get("events", 0) >= 1
        assert counts.get("complaints", 0) >= 1
        assert counts.get("active_subscriptions", 0) >= 1
        assert counts.get("suggested_cafes", 0) >= 1
