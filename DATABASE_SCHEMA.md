# Database Schema

## Tables Overview

| Table | Description |
|-------|-------------|
| `users` | All platform users (customers, cafe owners, admins) |
| `user_page_permissions` | Page-level permission assignments for admin users |
| `cafes` | Cafe registrations and profiles |
| `branches` | Cafe branch locations |
| `products` | Cafe product catalog |
| `offers` | Cafe promotional offers |
| `events` | Cafe events |
| `complaints` | Customer complaints |
| `notifications` | Admin-sent notifications (SMS/push) |
| `subscription_plans` | Available subscription plan definitions |
| `subscriptions` | User subscription records |
| `payments` | Payment transaction records |
| `coupons` | Discount coupon definitions |
| `suggested_cafes` | Customer-submitted cafe suggestions |

---

## Core Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | varchar(36) PK | UUID |
| `role` | enum | `CUSTOMER`, `CAFE_OWNER`, `ADMIN`, `SUPER_ADMIN` |
| `full_name` | varchar(255) | |
| `email` | varchar(255) | Unique, nullable |
| `phone` | varchar(20) | Unique, nullable |
| `password_hash` | text | Nullable (Google-only users) |
| `google_id` | varchar(255) | Nullable, for OAuth users |
| `status` | enum | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `email_verified` | boolean | |
| `phone_verified` | boolean | |
| `profile_image` | text | Nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `user_page_permissions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | varchar(36) PK | |
| `user_id` | varchar(36) FK→users | CASCADE delete |
| `page` | enum | `PagePermission` values |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| | Unique | `(user_id, page)` |

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| `id` | varchar(36) PK | |
| `title` | varchar(255) | |
| `message` | varchar(2000) | |
| `target_type` | enum | `ALL`, `CUSTOMER`, `CAFE_OWNER`, `CAFE`, `USER` |
| `target_id` | varchar(36) | Nullable, for specific-target notifications |
| `created_by` | varchar(36) FK→users | SET NULL on delete |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `suggested_cafes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | varchar(36) PK | |
| `owner_name` | varchar(255) | |
| `city` | varchar(255) | |
| `phone` | varchar(50) | |
| `google_link` | varchar(500) | Nullable |
| `status` | enum | `NEW`, `SENT`, `APPROVED`, `REJECTED` |
| `admin_notes` | text | Nullable |
| `website` | varchar(500) | Nullable |
| `facebook` | varchar(500) | Nullable |
| `instagram` | varchar(500) | Nullable |
| `telegram` | varchar(500) | Nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | varchar(36) PK | |
| `user_id` | varchar(36) FK→users | CASCADE delete |
| `plan_id` | varchar(36) FK→subscription_plans | CASCADE delete |
| `status` | enum | `ACTIVE`, `EXPIRED`, `CANCELLED`, `PENDING` |
| `starts_at` | timestamptz | Nullable |
| `expires_at` | timestamptz | Nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `subscription_plans`
| Column | Type | Notes |
|--------|------|-------|
| `id` | varchar(36) PK | |
| `name` | varchar(255) | Unique |
| `description` | text | Nullable |
| `subscriber_type` | enum | `CUSTOMER`, `CAFE_OWNER` |
| `billing_cycle` | enum | `MONTHLY`, `ANNUAL` |
| `price` | numeric(10,2) | |
| `currency` | varchar(3) | Default: `SAR` |
| `duration_days` | integer | |
| `is_active` | boolean | Default: true |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## Migrations History

| Revision | Description |
|----------|-------------|
| `001` | Initial schema — users, cafes, branches, products, offers, events, complaints |
| `002` | Notifications table |
| `003` | Suggested cafes table |
| `004` | User page permissions |
| `005` | Coupons table |
| `006` | Subscriptions, subscription plans, payments (Moyasar integration) |
| `007` | Add `created_by` column to notifications |
| `008` | Add `updated_at` column to notifications |
