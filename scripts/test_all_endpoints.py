"""Full API Test Script for Cafe Platform Backend."""
import requests
import json
import sys
from datetime import datetime, timedelta

BASE = "http://localhost:8000/api/v1"
HEALTH = "http://localhost:8000/health"
PASS = 0
FAIL = 0
TOKEN = None
REFRESH_TOKEN = None
CAFE_OWNER_TOKEN = None
CUSTOMER_TOKEN = None
ADMIN_TOKEN = None
CREATED_IDS = {}


def header(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")


def sub(msg):
    print(f"\n  --- {msg}")


def test(method, path, expected_status=None, data=None, token=None, label=None, params=None, base_url=None, ok_statuses=None):
    global PASS, FAIL
    url = f"{base_url or BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=10, params=params)
        elif method == "POST":
            r = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            r = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, timeout=10)
        else:
            print(f"  [SKIP] Unknown method {method}")
            return None

        status = r.status_code
        try:
            body = r.json()
        except:
            body = r.text

        if expected_status is not None:
            ok = status == expected_status
        elif ok_statuses and status in ok_statuses:
            ok = True
        else:
            ok = 200 <= status < 300

        icon = "PASS" if ok else "FAIL"
        name = label or f"{method} {path}"
        print(f"  [{icon}] {name} -> {status}")
        if not ok:
            print(f"         Expected: {expected_status}, Got: {status}")
            if isinstance(body, dict):
                print(f"         Response: {json.dumps(body, indent=2, ensure_ascii=False)[:300]}")
            FAIL += 1
        else:
            PASS += 1

        return {"status": status, "body": body}

    except Exception as e:
        print(f"  [FAIL] {label or path} -> ERROR: {e}")
        FAIL += 1
        return None


def extract(data, *keys):
    """Safely extract nested value from response."""
    if data is None:
        return None
    val = data.get("body", data)
    for k in keys:
        if isinstance(val, dict):
            val = val.get(k)
        else:
            return None
    return val


# ============================================================
header("1. HEALTH CHECK")
# ============================================================
test("GET", "/health", 200, label="GET /health", base_url="http://localhost:8000")


# ============================================================
header("2. AUTH - Login as Super Admin")
# ============================================================
r = test("POST", "/auth/login", 200, data={"email": "admin@cafe.com", "password": "Admin123!"}, label="Login super admin")
if r:
    TOKEN = extract(r, "data", "access_token")
    REFRESH_TOKEN = extract(r, "data", "refresh_token")
    user = extract(r, "data", "user")
    if user:
        print(f"         User: {user.get('full_name')} ({user.get('role')})")
    if not TOKEN:
        print("  [FAIL] No access_token in response!")
        FAIL += 1


# ============================================================
header("3. AUTH - Get Current User")
# ============================================================
test("GET", "/auth/me", 200, token=TOKEN, label="GET /auth/me")


# ============================================================
header("4. AUTH - Refresh Token")
# ============================================================
if REFRESH_TOKEN:
    r = test("POST", "/auth/refresh", 200, data={"refresh_token": REFRESH_TOKEN}, label="Refresh token")
    if r:
        new_token = extract(r, "data", "access_token")
        if new_token:
            TOKEN = new_token


# ============================================================
header("5. AUTH - Register a Customer")
# ============================================================
r = test("POST", "/auth/register", None,
    data={"full_name": "Test Customer", "email": "testcustomer@test.com", "password": "Test1234!", "role": "CUSTOMER"},
    label="Register customer", ok_statuses=[201, 409])
if r and r["status"] == 201:
    CUSTOMER_TOKEN = extract(r, "data", "access_token")
if not CUSTOMER_TOKEN:
    # Try login instead (user may already exist)
        # Try login instead
        r2 = test("POST", "/auth/login", 200,
            data={"email": "testcustomer@test.com", "password": "Test1234!"},
            label="Login customer (fallback)")
        if r2:
            CUSTOMER_TOKEN = extract(r2, "data", "access_token")


# ============================================================
header("6. AUTH - Register a Cafe Owner")
# ============================================================
r = test("POST", "/auth/register", None,
    data={"full_name": "Test Cafe Owner", "email": "testowner@test.com", "password": "Test1234!", "role": "CAFE_OWNER"},
    label="Register cafe owner", ok_statuses=[201, 409])
if r:
    CAFE_OWNER_TOKEN = extract(r, "data", "access_token")
    if not CAFE_OWNER_TOKEN:
        r2 = test("POST", "/auth/login", 200,
            data={"email": "testowner@test.com", "password": "Test1234!"},
            label="Login cafe owner (fallback)")
        if r2:
            CAFE_OWNER_TOKEN = extract(r2, "data", "access_token")


# ============================================================
header("7. AUTH - Register Blocked for Admin")
# ============================================================
test("POST", "/auth/register", 403,
    data={"full_name": "Bad Admin", "email": "bad@test.com", "password": "Test1234!", "role": "ADMIN"},
    label="Register as ADMIN (should be blocked)")


# ============================================================
header("8. ADMINS - Create Admin (Super Admin Only)")
# ============================================================
r = test("POST", "/admins", None,
    data={"full_name": "Test Admin", "email": "testadmin@test.com", "password": "Admin123!", "role": "ADMIN"},
    token=TOKEN, label="Create admin", ok_statuses=[200, 409])
if r:
    admin_id = extract(r, "data", "id")
    if admin_id:
        CREATED_IDS["admin_id"] = admin_id
        print(f"         Admin ID: {admin_id}")

# Login as the new admin
r = test("POST", "/auth/login", 200,
    data={"email": "testadmin@test.com", "password": "Admin123!"},
    label="Login as new admin")
if r:
    ADMIN_TOKEN = extract(r, "data", "access_token")


# ============================================================
header("9. ADMINS - List / Get / Update Admins")
# ============================================================
test("GET", "/admins", 200, token=TOKEN, label="List admins")
if CREATED_IDS.get("admin_id"):
    test("GET", f"/admins/{CREATED_IDS['admin_id']}", 200, token=TOKEN, label="Get admin by ID")
    test("PUT", f"/admins/{CREATED_IDS['admin_id']}", 200,
        data={"full_name": "Updated Admin"}, token=TOKEN, label="Update admin")


# ============================================================
header("10. ADMINS - Page Permissions")
# ============================================================
if CREATED_IDS.get("admin_id"):
    aid = CREATED_IDS["admin_id"]
    test("GET", f"/admins/{aid}/permissions", 200, token=TOKEN, label="Get admin permissions")
    test("PUT", f"/admins/{aid}/permissions", 200,
        data={"pages": ["Dashboard", "Cafes", "Products"]}, token=TOKEN, label="Update admin permissions")
    test("GET", f"/admins/{aid}/permissions", 200, token=TOKEN, label="Verify permissions updated")


# ============================================================
header("11. USERS - CRUD")
# ============================================================
test("GET", "/users", 200, token=TOKEN, label="List users")
test("GET", "/users", 200, token=TOKEN, params={"page": 1, "page_size": 5}, label="List users with pagination")
r = test("GET", "/users", 200, token=TOKEN, params={"search": "admin"}, label="Search users")
if r:
    items = extract(r, "data", "items") or extract(r, "data") or []
    if isinstance(items, list) and len(items) > 0:
        uid = items[0].get("id")
        if uid:
            CREATED_IDS["user_id"] = uid
            test("GET", f"/users/{uid}", 200, token=TOKEN, label="Get user by ID")
            test("PUT", f"/users/{uid}", 200, data={"full_name": items[0]["full_name"]}, token=TOKEN, label="Update user")


# ============================================================
header("12. CUSTOMERS - List")
# ============================================================
test("GET", "/customers", 200, token=TOKEN, label="List customers")


# ============================================================
header("13. CAFE OWNERS - List")
# ============================================================
test("GET", "/cafe-owners", 200, token=TOKEN, label="List cafe owners")


# ============================================================
header("14. CAFES - Create (Cafe Owner) + Admin Operations")
# ============================================================
r = test("POST", "/cafes", 200,
    data={
        "name": "Test Cafe Alpha",
        "description": "A test cafe for API testing",
        "address": "King Fahd Road, Riyadh",
        "latitude": 24.7136,
        "longitude": 46.6753,
        "place_id": "ChIJ-test-place-id-123",
        "working_hours": {"saturday": "8:00-22:00", "sunday": "8:00-22:00"}
    },
    token=CAFE_OWNER_TOKEN, label="Create cafe (cafe owner)")
if r:
    cafe_id = extract(r, "data", "id")
    if cafe_id:
        CREATED_IDS["cafe_id"] = cafe_id
        print(f"         Cafe ID: {cafe_id}")

test("GET", "/cafes/public", 200, label="List public cafes")
test("GET", "/cafes", 200, token=TOKEN, label="List all cafes (admin)")
test("GET", "/cafes/nearby", 200, params={"latitude": 24.7136, "longitude": 46.6753, "radius_km": 10}, label="Nearby cafes (haversine)")
test("POST", "/cafes", 422,
    data={
        "name": "Bad Cafe",
        "description": "Partial coordinates should be rejected",
        "address": "No Location",
        "latitude": 24.7136
    },
    token=CAFE_OWNER_TOKEN, label="Create cafe with partial coordinates (should fail)")
if CREATED_IDS.get("cafe_id"):
    cid = CREATED_IDS["cafe_id"]
    test("GET", f"/cafes/{cid}", 200, label="Get cafe by ID (public)")
    test("POST", f"/cafes/{cid}/approve", 200, token=TOKEN, label="Approve cafe")
    test("PUT", f"/cafes/{cid}", 200, data={"description": "Updated description"}, token=CAFE_OWNER_TOKEN, label="Update cafe")


# ============================================================
header("15. BRANCHES - CRUD")
# ============================================================
if CREATED_IDS.get("cafe_id"):
    cid = CREATED_IDS["cafe_id"]
    r = test("POST", "/branches", 200,
        data={
            "name": "Branch 1",
            "address": "Olaya Street, Riyadh",
            "latitude": 24.7136,
            "longitude": 46.6753,
            "place_id": "ChIJ-test-branch-place-id",
            "cafe_id": cid
        },
        token=CAFE_OWNER_TOKEN, label="Create branch")
    if r:
        branch_id = extract(r, "data", "id")
        if branch_id:
            CREATED_IDS["branch_id"] = branch_id
    test("GET", f"/branches/cafe/{cid}", 200, label="List branches for cafe")
    if CREATED_IDS.get("branch_id"):
        bid = CREATED_IDS["branch_id"]
        test("GET", f"/branches/{bid}", 200, label="Get branch")
        test("PUT", f"/branches/{bid}", 200, data={"name": "Branch 1 Updated"}, token=CAFE_OWNER_TOKEN, label="Update branch")


# ============================================================
header("16. PRODUCTS - CRUD")
# ============================================================
if CREATED_IDS.get("cafe_id"):
    cid = CREATED_IDS["cafe_id"]
    r = test("POST", "/products", 200,
        data={"name": "Latte", "description": "Classic latte", "price": 18.0, "availability": True, "cafe_id": cid},
        token=CAFE_OWNER_TOKEN, label="Create product")
    if r:
        prod_id = extract(r, "data", "id")
        if prod_id:
            CREATED_IDS["product_id"] = prod_id
    test("GET", f"/products/cafe/{cid}", 200, label="List products for cafe")
    test("GET", "/products", 200, token=TOKEN, label="List all products (admin)")

if CREATED_IDS.get("product_id"):
    pid = CREATED_IDS["product_id"]
    test("GET", f"/products/{pid}", 200, label="Get product")
    test("PUT", f"/products/{pid}", 200, data={"price": 22.0}, token=CAFE_OWNER_TOKEN, label="Update product")


# ============================================================
header("17. OFFERS - CRUD")
# ============================================================
if CREATED_IDS.get("cafe_id"):
    cid = CREATED_IDS["cafe_id"]
    now = datetime.utcnow()
    r = test("POST", "/offers", 200,
        data={
            "title": "Happy Hour",
            "description": "20% off all drinks",
            "discount_percentage": 20,
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=30)).isoformat(),
            "cafe_id": cid,
            "status": "ACTIVE"
        },
        token=CAFE_OWNER_TOKEN, label="Create offer")
    if r:
        offer_id = extract(r, "data", "id")
        if offer_id:
            CREATED_IDS["offer_id"] = offer_id
    test("GET", f"/offers/cafe/{cid}", 200, label="List offers for cafe")
    test("GET", "/offers", 200, token=TOKEN, label="List all offers (admin)")

if CREATED_IDS.get("offer_id"):
    oid = CREATED_IDS["offer_id"]
    test("GET", f"/offers/{oid}", 200, label="Get offer")
    test("PUT", f"/offers/{oid}", 200, data={"discount_percentage": 25}, token=CAFE_OWNER_TOKEN, label="Update offer")


# ============================================================
header("18. EVENTS - CRUD")
# ============================================================
if CREATED_IDS.get("cafe_id"):
    cid = CREATED_IDS["cafe_id"]
    r = test("POST", "/events", 200,
        data={
            "title": "Coffee Tasting",
            "description": "Join us for a tasting session",
            "location": "Test Cafe Alpha, Riyadh",
            "event_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "cafe_id": cid,
            "status": "PUBLISHED"
        },
        token=CAFE_OWNER_TOKEN, label="Create event")
    if r:
        event_id = extract(r, "data", "id")
        if event_id:
            CREATED_IDS["event_id"] = event_id
    test("GET", f"/events/cafe/{cid}", 200, label="List events for cafe")
    test("GET", "/events", 200, token=TOKEN, label="List all events (admin)")

if CREATED_IDS.get("event_id"):
    eid = CREATED_IDS["event_id"]
    test("GET", f"/events/{eid}", 200, label="Get event")
    test("PUT", f"/events/{eid}", 200, data={"status": "COMPLETED"}, token=CAFE_OWNER_TOKEN, label="Update event")


# ============================================================
header("19. COMPLAINTS - Create + Admin Operations")
# ============================================================
if CREATED_IDS.get("cafe_id") and CUSTOMER_TOKEN:
    cid = CREATED_IDS["cafe_id"]
    # We need customer_id - get from /auth/me
    me = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {CUSTOMER_TOKEN}"}, timeout=10).json()
    customer_id = extract(me, "data", "id")
    if customer_id:
        r = test("POST", "/complaints", 200,
            data={
                "subject": "Slow service",
                "description": "Waited 30 minutes for my coffee",
                "customer_id": customer_id,
                "cafe_id": cid
            },
            token=CUSTOMER_TOKEN, label="Create complaint")
        if r:
            complaint_id = extract(r, "data", "id")
            if complaint_id:
                CREATED_IDS["complaint_id"] = complaint_id

test("GET", "/complaints", 200, token=TOKEN, label="List all complaints (admin)")

if CREATED_IDS.get("complaint_id"):
    cpid = CREATED_IDS["complaint_id"]
    test("GET", f"/complaints/{cpid}", 200, token=TOKEN, label="Get complaint")
    test("PUT", f"/complaints/{cpid}", 200,
        data={"status": "IN_PROGRESS", "admin_response": "We are looking into this"},
        token=TOKEN, label="Update complaint (admin response)")


# ============================================================
header("20. SUBSCRIPTION PLANS - CRUD")
# ============================================================
r = test("POST", "/subscription-plans", 200,
    data={"name": "Gold Plan", "price": 299.0, "duration_days": 30, "is_active": True, "features": ["الظهور في قائمة العروض", "قسم الكتالوج"]},
    token=TOKEN, label="Create subscription plan")
if r:
    plan_id = extract(r, "data", "id")
    if plan_id:
        CREATED_IDS["plan_id"] = plan_id

test("GET", "/subscription-plans", 200, token=TOKEN, label="List subscription plans")

if CREATED_IDS.get("plan_id"):
    plid = CREATED_IDS["plan_id"]
    test("GET", f"/subscription-plans/{plid}", 200, token=TOKEN, label="Get subscription plan")
    test("PUT", f"/subscription-plans/{plid}", 200, data={"price": 349.0}, token=TOKEN, label="Update subscription plan")


# ============================================================
header("21. SUBSCRIPTIONS - CRUD + Activate/Cancel")
# ============================================================
if CREATED_IDS.get("cafe_id") and CREATED_IDS.get("plan_id"):
    cid = CREATED_IDS["cafe_id"]
    plid = CREATED_IDS["plan_id"]
    now = datetime.utcnow()
    r = test("POST", "/subscriptions", 200,
        data={
            "cafe_id": cid,
            "plan_id": plid,
            "status": "PENDING",
            "start_date": now.isoformat(),
            "expiration_date": (now + timedelta(days=30)).isoformat()
        },
        token=TOKEN, label="Create subscription")
    if r:
        sub_id = extract(r, "data", "id")
        if sub_id:
            CREATED_IDS["subscription_id"] = sub_id

test("GET", "/subscriptions", 200, token=TOKEN, label="List subscriptions")

if CREATED_IDS.get("subscription_id"):
    sid = CREATED_IDS["subscription_id"]
    test("GET", f"/subscriptions/{sid}", 200, token=TOKEN, label="Get subscription")
    test("PUT", f"/subscriptions/{sid}", 200, data={"status": "ACTIVE"}, token=TOKEN, label="Update subscription")

# Activate via cafe endpoint
if CREATED_IDS.get("cafe_id") and CREATED_IDS.get("plan_id"):
    test("POST", f"/subscriptions/cafe/{cid}/activate?plan_id={plid}", 200, token=TOKEN, label="Activate subscription for cafe")
    test("POST", f"/subscriptions/cafe/{cid}/cancel", 200, token=TOKEN, label="Cancel subscription for cafe")


# ============================================================
header("22. COUPONS - CRUD")
# ============================================================
r = test("POST", "/coupons", 200,
    data={"code": "SUMMER25", "discount_percent": 25, "max_uses": 100, "start_date": "2026-01-01T00:00:00Z", "end_date": "2026-12-31T23:59:59Z"},
    token=TOKEN, label="Create coupon")
if r:
    coupon_id = extract(r, "data", "id")
    if coupon_id:
        CREATED_IDS["coupon_id"] = coupon_id

test("GET", "/coupons", 200, token=TOKEN, label="List coupons")

if CREATED_IDS.get("coupon_id"):
    cpid = CREATED_IDS["coupon_id"]
    test("GET", f"/coupons/{cpid}", 200, token=TOKEN, label="Get coupon")
    test("PUT", f"/coupons/{cpid}", 200, data={"discount_percent": 30}, token=TOKEN, label="Update coupon")
    test("DELETE", f"/coupons/{cpid}", 200, token=TOKEN, label="Delete coupon")


# ============================================================
header("23. NOTIFICATIONS - CRUD")
# ============================================================
r = test("POST", "/notifications", 200,
    data={"title": "System Update", "message": "Platform will be under maintenance", "target_type": "ALL"},
    token=TOKEN, label="Create notification")
if r:
    notif_id = extract(r, "data", "id")
    if notif_id:
        CREATED_IDS["notif_id"] = notif_id

test("GET", "/notifications", 200, token=TOKEN, label="List notifications")

if CREATED_IDS.get("notif_id"):
    nid = CREATED_IDS["notif_id"]
    test("GET", f"/notifications/{nid}", 200, token=TOKEN, label="Get notification")


# ============================================================
header("23. DASHBOARD - Stats")
# ============================================================
test("GET", "/dashboard", 200, token=TOKEN, label="Get dashboard stats")


# ============================================================
header("24. MOBILE API - Public Catalog")
# Mobile catalog endpoints must remain public but only expose approved cafes.
test("GET", "/mobile/cafes", 200, label="Mobile list cafes")
test("GET", "/mobile/cafes/nearby?latitude=24.7&longitude=46.7", 200, label="Mobile nearby cafes")
if CREATED_IDS.get("cafe_id"):
    mobile_cafe_id = CREATED_IDS["cafe_id"]
    test("GET", f"/mobile/cafes/{mobile_cafe_id}", 200, label="Mobile cafe details")
    test("GET", f"/mobile/cafes/{mobile_cafe_id}/products", 200, label="Mobile cafe products")
    test("GET", f"/mobile/cafes/{mobile_cafe_id}/offers", 200, label="Mobile cafe offers")
    test("GET", f"/mobile/cafes/{mobile_cafe_id}/events", 200, label="Mobile cafe events")
test("GET", "/mobile/complaints", 403, token=TOKEN, label="Mobile complaints require customer")


# ============================================================
header("25. AUTH - Send OTP")
# ============================================================
test("POST", "/auth/send-otp", None, data={"phone": "+966500000000"}, label="Send OTP (Twilio/Dev provider)", ok_statuses=[200, 400, 500])


# ============================================================
header("26. CLEANUP - Delete Test Data")
# ============================================================
# Delete in reverse order
if CREATED_IDS.get("notif_id"):
    test("DELETE", f"/notifications/{CREATED_IDS['notif_id']}", 200, token=TOKEN, label="Delete notification")
if CREATED_IDS.get("subscription_id"):
    test("DELETE", f"/subscriptions/{CREATED_IDS['subscription_id']}", 200, token=TOKEN, label="Delete subscription")
if CREATED_IDS.get("plan_id"):
    test("DELETE", f"/subscription-plans/{CREATED_IDS['plan_id']}", 200, token=TOKEN, label="Delete subscription plan")
if CREATED_IDS.get("event_id"):
    test("DELETE", f"/events/{CREATED_IDS['event_id']}", 200, token=CAFE_OWNER_TOKEN, label="Delete event")
if CREATED_IDS.get("offer_id"):
    test("DELETE", f"/offers/{CREATED_IDS['offer_id']}", 200, token=CAFE_OWNER_TOKEN, label="Delete offer")
if CREATED_IDS.get("product_id"):
    test("DELETE", f"/products/{CREATED_IDS['product_id']}", 200, token=CAFE_OWNER_TOKEN, label="Delete product")
if CREATED_IDS.get("branch_id"):
    test("DELETE", f"/branches/{CREATED_IDS['branch_id']}", 200, token=CAFE_OWNER_TOKEN, label="Delete branch")


# ============================================================
header("27. AUTH - Logout")
# ============================================================
if REFRESH_TOKEN:
    test("POST", "/auth/logout", 200, data={"refresh_token": REFRESH_TOKEN}, label="Logout")


# ============================================================
header("RESULTS SUMMARY")
# ============================================================
total = PASS + FAIL
print(f"\n  Total: {total} | PASS: {PASS} | FAIL: {FAIL}")
if FAIL == 0:
    print(f"\n  ALL TESTS PASSED!")
else:
    print(f"\n  {FAIL} test(s) FAILED - review above")

print(f"\n  Created IDs for reference:")
for k, v in CREATED_IDS.items():
    print(f"    {k}: {v}")
print()
