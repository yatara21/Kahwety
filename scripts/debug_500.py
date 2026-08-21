"""Debug the 500 errors."""
import requests
import json

BASE = "http://localhost:8000/api/v1"

# Login
r = requests.post(f"{BASE}/auth/login", json={"email": "admin@cafe.com", "password": "Admin123!"})
token = r.json()["data"]["access_token"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 1. Debug notification create
print("=== NOTIFICATION CREATE ===")
r = requests.post(f"{BASE}/notifications", json={"title": "Test", "message": "msg", "target_type": "ALL"}, headers=h)
print(f"Status: {r.status_code}")
print(f"Headers: {dict(r.headers)}")
print(f"Body: {r.text[:1000]}")

# 2. Debug admin permissions update  
print("\n=== ADMIN PERMISSIONS ===")
r = requests.get(f"{BASE}/admins", headers=h)
admins = r.json().get("data", {}).get("items", [])
if admins:
    aid = admins[0]["id"]
    print(f"Admin ID: {aid}, role: {admins[0]['role']}")
    
    # Try the exact payload
    payload = {"pages": ["Dashboard", "Cafes", "Products"]}
    print(f"Payload: {json.dumps(payload)}")
    r = requests.put(f"{BASE}/admins/{aid}/permissions", json=payload, headers=h)
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text[:1000]}")
