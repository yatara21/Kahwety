# Authentication Guide

## Overview

The platform supports 3 authentication methods:
1. **Email/Password** — Traditional credentials
2. **Google OAuth 2.0** — Google Identity Services (ID Token flow)
3. **Phone OTP** — Twilio Verify SMS

All methods issue a pair of JWT tokens: `access_token` (short-lived, 15 min) and `refresh_token` (long-lived, 7 days).

---

## JWT Token Structure

```json
{
  "sub": "<user_id>",
  "type": "access",          // or "refresh"
  "role": "CUSTOMER",        // CUSTOMER | CAFE_OWNER | ADMIN | SUPER_ADMIN
  "exp": 1729000000
}
```

---

## Email / Password Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "user": { "id": "...", "email": "...", "role": "CUSTOMER" }
  }
}
```

---

## Google OAuth 2.0

The client loads Google Identity Services, prompts the user, and receives a Google ID Token (`credential`). This token is sent to the backend for validation.

```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "token": "<google_id_token>"
}
```

**Backend validation:**
1. Verifies token signature against Google's public keys
2. Validates `aud` (audience) matches `GOOGLE_CLIENT_ID`
3. Validates `exp` (not expired)
4. Creates user if new, links if existing
5. Returns platform JWT pair

**Environment variables required:**
```
GOOGLE_CLIENT_ID=<your_client_id>
```

---

## Phone OTP (Twilio Verify)

### Step 1 — Send OTP
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{ "phone": "+966501234567" }
```

### Step 2 — Verify OTP
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{ "phone": "+966501234567", "code": "123456" }
```

**Dev mode:** If `TWILIO_*` env vars are not set, the SMS provider falls back to a mock that logs the OTP to console.

---

## Token Refresh

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{ "refresh_token": "eyJ..." }
```

---

## Security Notes

- Access tokens expire in **15 minutes** (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Refresh tokens expire in **7 days** (configurable via `REFRESH_TOKEN_EXPIRE_DAYS`)
- All tokens are signed with `HS256` using `SECRET_KEY`
- Inactive or suspended users cannot obtain tokens
- `SUPER_ADMIN` cannot be deactivated if they are the last active super admin

---

## Role Hierarchy

| Role | Description |
|------|-------------|
| `CUSTOMER` | End users of the mobile app |
| `CAFE_OWNER` | Business owners managing their cafes |
| `ADMIN` | Platform staff with page-based permissions |
| `SUPER_ADMIN` | Full unrestricted platform access |
