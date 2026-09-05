"""
Comprehensive Live Integration and Endpoints Test Script for Kahwety Backend & Dashboard
Tests all endpoints, image uploads, real database stats, and live event counts.
"""
import sys
import json
import uuid
import urllib.request
import urllib.error
import io

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_URL = "http://localhost:8000/api/v1"
STATIC_BASE_URL = "http://localhost:8000"

def request(endpoint, method="GET", data=None, token=None, files=None):
    url = f"{BASE_URL}{endpoint}" if not endpoint.startswith("http") else endpoint
    headers = {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    body = None
    if files:
        boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        buffer = io.BytesIO()
        for field_name, (filename, file_bytes, mime_type) in files.items():
            buffer.write(f"--{boundary}\r\n".encode("utf-8"))
            buffer.write(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8"))
            buffer.write(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
            buffer.write(file_bytes)
            buffer.write(b"\r\n")
        buffer.write(f"--{boundary}--\r\n".encode("utf-8"))
        body = buffer.getvalue()
    elif data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            raw = response.read()
            try:
                content = raw.decode("utf-8")
                try:
                    res_json = json.loads(content)
                except Exception:
                    res_json = content
            except UnicodeDecodeError:
                res_json = raw
            return status, res_json
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            content = raw.decode("utf-8")
            try:
                res_json = json.loads(content)
            except Exception:
                res_json = content
        except UnicodeDecodeError:
            res_json = raw
        return e.code, res_json

passed = 0
failed = 0

def check(name, condition, details=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  [PASS] {name} {details}")
    else:
        failed += 1
        print(f"  [FAIL] {name} - Details: {details}")

def run_tests():
    print("=" * 70)
    print("KAHWETY LIVE SYSTEM & DASHBOARD VERIFICATION SUITE")
    print("=" * 70)

    # 1. Health & Readiness
    print("\n1. Testing Health & Readiness Endpoints:")
    st, res = request("http://localhost:8000/health")
    check("GET /health", st == 200 and res.get("status") == "ok", f"Status: {st}")
    st, res = request("http://localhost:8000/ready")
    check("GET /ready", st == 200 and res.get("status") == "ready", f"Status: {st}")

    # 2. Authentication
    print("\n2. Testing Super Admin Authentication:")
    st, res = request("/auth/login", method="POST", data={"email": "admin@cafe.com", "password": "Admin123!"})
    token = res.get("data", {}).get("access_token") if isinstance(res, dict) else None
    check("POST /auth/login", st == 200 and token is not None, f"Status: {st}")

    st, me = request("/auth/me", token=token)
    check("GET /auth/me", st == 200 and me.get("data", {}).get("role") == "SUPER_ADMIN", f"Role: {me.get('data', {}).get('role') if isinstance(me, dict) else 'none'}")

    # 3. Real Image Upload & Image Serving
    print("\n3. Testing Multipart Image Upload & Static File Serving:")
    fake_png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    st, upload_res = request("/uploads/image", method="POST", token=token, files={"file": ("test_banner.png", fake_png_bytes, "image/png")})
    uploaded_url = upload_res.get("data", {}).get("url") if isinstance(upload_res, dict) else ""
    check("POST /uploads/image", st == 200 and uploaded_url.startswith("/static/uploads/"), f"URL: {uploaded_url}")

    if uploaded_url:
        st, img_content = request(f"{STATIC_BASE_URL}{uploaded_url}")
        check("GET /static/uploads/... (Serving uploaded image)", st == 200, f"Status: {st}")

    # 4. Create Cafe Owner & Real Cafe
    print("\n4. Testing Cafe & Branch Endpoints:")
    rand_id = uuid.uuid4().hex[:6]
    st, owner_res = request("/users", method="POST", token=token, data={
        "role": "CAFE_OWNER",
        "full_name": f"Owner {rand_id}",
        "email": f"owner_{rand_id}@example.com",
        "password": "Password123!"
    })
    owner_id = owner_res.get("data", {}).get("id") if isinstance(owner_res, dict) else None
    check("POST /users (Create Cafe Owner)", st in (200, 201) and owner_id is not None, f"Owner ID: {owner_id}")

    st, cafe_res = request("/cafes", method="POST", token=token, data={
        "name": f"Specialty Cafe {rand_id}",
        "description": "Authentic Saudi specialty coffee",
        "address": "Riyadh Olaya St",
        "logo_url": uploaded_url,
        "owner_id": owner_id
    })
    cafe_id = cafe_res.get("data", {}).get("id") if isinstance(cafe_res, dict) else None
    check("POST /cafes (Create Cafe)", st in (200, 201) and cafe_id is not None, f"Cafe ID: {cafe_id}")

    st, branch_res = request("/branches", method="POST", token=token, data={
        "cafe_id": cafe_id,
        "name": "Olaya Main Branch",
        "address": "Olaya Main St, Riyadh",
        "phone": f"+9665{uuid.uuid4().int % 100000000:08d}",
        "latitude": 24.7136,
        "longitude": 46.6753
    })
    branch_id = branch_res.get("data", {}).get("id") if isinstance(branch_res, dict) else None
    check("POST /branches (Create Branch)", st in (200, 201) and branch_id is not None, f"Branch ID: {branch_id}")

    # 5. Products, Offers & Real Events
    print("\n5. Testing Products, Offers & Events Endpoints:")
    st, prod_res = request("/products", method="POST", token=token, data={
        "cafe_id": cafe_id,
        "name": "V60 Ethiopian",
        "name_en": "V60 Ethiopian Roast",
        "description": "Single origin pour over",
        "price": 22.0,
        "image_url": uploaded_url
    })
    prod_id = prod_res.get("data", {}).get("id") if isinstance(prod_res, dict) else None
    check("POST /products (Create Product)", st in (200, 201) and prod_id is not None, f"Product ID: {prod_id}")

    st, offer_res = request("/offers", method="POST", token=token, data={
        "cafe_id": cafe_id,
        "title": "Grand Opening 30% Off",
        "description": "30% discount on all hot drinks",
        "discount_percentage": 30,
        "image_url": uploaded_url,
        "start_date": "2026-09-01T00:00:00Z",
        "end_date": "2026-09-10T00:00:00Z"
    })
    offer_id = offer_res.get("data", {}).get("id") if isinstance(offer_res, dict) else None
    check("POST /offers (Create Offer)", st in (200, 201) and offer_id is not None, f"Offer ID: {offer_id}")

    st, event_res = request("/events", method="POST", token=token, data={
        "cafe_id": cafe_id,
        "title": "Latte Art Championship 2026",
        "description": "Live barista latte art competition",
        "location": "Riyadh Olaya Main Branch",
        "image_url": uploaded_url,
        "event_date": "2026-09-15T18:00:00Z"
    })
    event_id = event_res.get("data", {}).get("id") if isinstance(event_res, dict) else None
    check("POST /events (Create Real Event)", st in (200, 201) and event_id is not None, f"Event ID: {event_id}")

    # 6. Customer & Complaint with Enrichment
    print("\n6. Testing Customer, Complaint & Enrichment Endpoints:")
    cust_email = f"cust_{rand_id}@example.com"
    cust_pass = "Password123!"
    cust_phone = f"+9665{uuid.uuid4().int % 100000000:08d}"
    st, cust_res = request("/users", method="POST", token=token, data={
        "role": "CUSTOMER",
        "full_name": f"Customer {rand_id}",
        "email": cust_email,
        "phone": cust_phone,
        "password": cust_pass
    })
    cust_id = cust_res.get("data", {}).get("id") if isinstance(cust_res, dict) else None
    check("POST /users (Create Customer)", st in (200, 201) and cust_id is not None, f"Cust ID: {cust_id}")

    # Login as Customer to create customer-scoped complaint
    st, cust_login = request("/auth/login", method="POST", data={"email": cust_email, "password": cust_pass})
    cust_token = cust_login.get("data", {}).get("access_token") if isinstance(cust_login, dict) else None

    st, comp_res = request("/complaints", method="POST", token=cust_token, data={
        "customer_id": cust_id,
        "cafe_id": cafe_id,
        "subject": "Slow Service During Event",
        "description": "Waited 25 minutes for order."
    })
    comp_id = comp_res.get("data", {}).get("id") if isinstance(comp_res, dict) else None
    customer_info = comp_res.get("data", {}).get("customer") if isinstance(comp_res, dict) else None
    cafe_info = comp_res.get("data", {}).get("cafe") if isinstance(comp_res, dict) else None
    check("POST /complaints (Create & Auto-Enrich)", st in (200, 201) and customer_info is not None and cafe_info is not None, f"Customer: {customer_info.get('full_name') if customer_info else ''}")

    # 7. Subscription Plan & Subscriptions with Enrichment
    print("\n7. Testing Subscription Plans & Subscription Enrichment:")
    st, plan_res = request("/admin/subscription-plans", method="POST", token=token, data={
        "name": f"VIP Cafe Tier {rand_id}",
        "subscriber_type": "CAFE_OWNER",
        "billing_cycle": "MONTHLY",
        "price": 299.0,
        "currency": "SAR",
        "duration_days": 30
    })
    plan_id = plan_res.get("data", {}).get("id") if isinstance(plan_res, dict) else None
    check("POST /admin/subscription-plans", st in (200, 201) and plan_id is not None, f"Plan ID: {plan_id}")

    st, sub_res = request("/admin/subscriptions", method="POST", token=token, data={
        "user_id": owner_id,
        "plan_id": plan_id,
        "status": "ACTIVE"
    })
    sub_id = sub_res.get("data", {}).get("id") if isinstance(sub_res, dict) else None
    sub_user = sub_res.get("data", {}).get("user") if isinstance(sub_res, dict) else None
    sub_plan = sub_res.get("data", {}).get("plan") if isinstance(sub_res, dict) else None
    check("POST /admin/subscriptions (Create & Auto-Enrich)", st in (200, 201) and sub_user is not None and sub_plan is not None, f"User: {sub_user.get('full_name') if sub_user else ''}, Plan: {sub_plan.get('name') if sub_plan else ''}")

    # 8. Suggested Cafes
    print("\n8. Testing Suggested Cafes Endpoints:")
    st, sug_res = request("/suggested-cafes", method="POST", data={
        "owner_name": "Sultan Al-Harbi",
        "city": "Riyadh",
        "phone": "+966522222222",
        "google_link": "https://maps.google.com/?q=cafe"
    })
    sug_id = sug_res.get("data", {}).get("id") if isinstance(sug_res, dict) else None
    check("POST /suggested-cafes (Customer suggestion)", st in (200, 201) and sug_id is not None, f"ID: {sug_id}")

    # 9. Google Maps API for Flutter & Mobile
    print("\n9. Testing Google Maps Endpoints for Flutter:")
    st, map_res = request("/map/cafes")
    markers = map_res.get("data", {}).get("markers", []) if isinstance(map_res, dict) else []
    check("GET /api/v1/map/cafes", st == 200 and len(markers) >= 1, f"Markers count: {len(markers)}")

    # Test with user coordinates (Riyadh: 24.7136, 46.6753)
    st, nearby_map = request("/map/cafes?latitude=24.7136&longitude=46.6753&radius_km=50")
    nearby_markers = nearby_map.get("data", {}).get("markers", []) if isinstance(nearby_map, dict) else []
    check("GET /api/v1/map/cafes with user coordinates & radius", st == 200 and len(nearby_markers) >= 1, f"Closest: {nearby_markers[0].get('display_title') if nearby_markers else ''}, Dist: {nearby_markers[0].get('distance_km') if nearby_markers else ''}km")

    # Test mobile alias
    st, mobile_map = request("/mobile/map/cafes")
    check("GET /api/v1/mobile/map/cafes (Flutter alias)", st == 200 and isinstance(mobile_map.get("data", {}).get("markers"), list), f"Status: {st}")

    # 10. Real Live Dashboard Statistics Verification
    print("\n10. Verifying Real Dashboard Statistics & Real DB Events:")
    st, dash = request("/dashboard", token=token)
    counts = dash.get("data", {}).get("counts", {}) if isinstance(dash, dict) else {}
    analytics = dash.get("data", {}).get("analytics", {}) if isinstance(dash, dict) else {}

    check("GET /dashboard Status", st == 200, f"Status: {st}")
    check("Real Events Count >= 1", counts.get("events", 0) >= 1, f"Count: {counts.get('events')}")
    check("Real Products Count >= 1", counts.get("products", 0) >= 1, f"Count: {counts.get('products')}")
    check("Real Offers Count >= 1", counts.get("offers", 0) >= 1, f"Count: {counts.get('offers')}")
    check("Real Cafes Count >= 1", counts.get("cafes", 0) >= 1, f"Count: {counts.get('cafes')}")
    check("Real Customers Count >= 1", counts.get("customers", 0) >= 1, f"Count: {counts.get('customers')}")
    check("Real Admins Count >= 1", counts.get("admins", 0) >= 1, f"Count: {counts.get('admins')}")
    check("Real Active Subscriptions >= 1", counts.get("active_subscriptions", 0) >= 1, f"Count: {counts.get('active_subscriptions')}")
    check("Real Complaints Count >= 1", counts.get("complaints", 0) >= 1, f"Count: {counts.get('complaints')}")
    check("Real Suggested Cafes >= 1", counts.get("suggested_cafes", 0) >= 1, f"Count: {counts.get('suggested_cafes')}")
    check("Dynamic Live Alerts Generated", len(analytics.get("recent_alerts", [])) > 0, f"Alert count: {len(analytics.get('recent_alerts', []))}")
    check("Dynamic Cities Distribution Generated", len(analytics.get("cities_distribution", [])) > 0, f"City buckets: {len(analytics.get('cities_distribution', []))}")

    print("\n" + "=" * 70)
    print(f"VERIFICATION SUMMARY: {passed} PASSED, {failed} FAILED")
    print("=" * 70)
    
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
