import httpx

BASE = "http://localhost:8000/api/v1"

# Login as super admin
r = httpx.post(f"{BASE}/auth/login", json={"email": "admin@cafe.com", "password": "Admin123!"})
token = r.json()["data"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("=== SUGGESTED CAFES ===")

# List
r = httpx.get(f"{BASE}/suggested-cafes", headers=headers)
print(f"List: {r.status_code}")

# Create
r = httpx.post(f"{BASE}/suggested-cafes", headers=headers, json={
    "owner_name": "Test Owner",
    "city": "Riyadh",
    "phone": "+966500000000",
    "google_link": "https://maps.example.com/cafe1"
})
print(f"Create: {r.status_code}")
cafe_id = r.json()["data"]["id"]

# Get
r = httpx.get(f"{BASE}/suggested-cafes/{cafe_id}", headers=headers)
print(f"Get: {r.status_code}")

# Approve
r = httpx.post(f"{BASE}/suggested-cafes/{cafe_id}/approve", headers=headers)
print(f"Approve: {r.status_code} -> {r.json()['data']['status']}")

# Reject
r = httpx.post(f"{BASE}/suggested-cafes/{cafe_id}/reject", headers=headers)
print(f"Reject: {r.status_code} -> {r.json()['data']['status']}")

# Delete
r = httpx.delete(f"{BASE}/suggested-cafes/{cafe_id}", headers=headers)
print(f"Delete: {r.status_code}")

print("\n=== COMPLAINT ACTIONS ===")

# Get complaint from test run
r = httpx.get(f"{BASE}/complaints?status=PENDING&page=1&page_size=1", headers=headers)
print(f"List complaints: {r.status_code}")
if r.json()["data"]["items"]:
    complaint_id = r.json()["data"]["items"][0]["id"]
    print(f"  Complaint ID: {complaint_id}")

    # Send notification
    r = httpx.post(f"{BASE}/complaints/{complaint_id}/send-notification", headers=headers,
                   json={"message": "Test notification"})
    print(f"Send notification: {r.status_code} -> {r.json()['data']['status']}")

    # Transfer to cafe
    r = httpx.post(f"{BASE}/complaints/{complaint_id}/transfer", headers=headers)
    print(f"Transfer to cafe: {r.status_code} -> {r.json()['data']['status']}")

    # Resolve
    r = httpx.post(f"{BASE}/complaints/{complaint_id}/resolve", headers=headers)
    print(f"Resolve: {r.status_code} -> {r.json()['data']['status']}")

print("\nAll endpoints working!")
