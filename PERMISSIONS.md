# Permissions Guide

## Overview

The platform uses **page-based permissions** for Admin users. Each page in the Admin Dashboard corresponds to a `PagePermission` enum value.

---

## Permission Enforcement

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | All pages — unrestricted |
| `ADMIN` | Only pages explicitly assigned |
| `CUSTOMER` / `CAFE_OWNER` | No admin access |

---

## Available Pages

| Permission Key | Admin Dashboard Page |
|----------------|---------------------|
| `Dashboard` | Dashboard statistics & overview |
| `Customers` | Customer user management |
| `Cafe Owners` | Cafe owner management |
| `Cafes` | Cafe approval & management |
| `Products` | Product catalog |
| `Offers` | Promotions & offers |
| `Events` | Cafe events |
| `Subscriptions` | Subscription plans & user subscriptions |
| `Complaints` | Customer complaint management |
| `Notifications` | Push/SMS notification center |
| `Admins` | Admin user management |
| `Suggested Cafes` | Customer-suggested cafe submissions |

---

## API Endpoints

### List available permissions
```http
GET /api/v1/admin/permissions
Authorization: Bearer <token>
```
Returns all 12 page permission values.

### Get admin's current permissions
```http
GET /api/v1/admin/admins/{id}/permissions
Authorization: Bearer <token>
```
Returns `SUPER_ADMIN` → all 12 pages, `ADMIN` → assigned pages only.

### Assign permissions to admin (SUPER_ADMIN only)
```http
PUT /api/v1/admin/admins/{id}/permissions
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "pages": ["Dashboard", "Customers", "Complaints"]
}
```
This **replaces** all existing permissions for that admin (not additive).

---

## Rules

1. `SUPER_ADMIN` cannot have permissions assigned (they already have all).
2. The last active `SUPER_ADMIN` cannot be deactivated or demoted.
3. Admins cannot deactivate/suspend themselves.
4. Only `SUPER_ADMIN` can create, update, or change the role of other admins.
5. Accessing an admin-only page without the matching permission returns `403 Forbidden`.
