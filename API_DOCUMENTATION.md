# Kahwety Cafe Platform — API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000/api/v1`  
**Auth:** JWT Bearer Token (`Authorization: Bearer <access_token>`)

---

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | None | Email/password login |
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/google` | None | Google ID Token login/register |
| POST | `/auth/send-otp` | None | Send phone OTP via Twilio |
| POST | `/auth/verify-otp` | None | Verify phone OTP |
| POST | `/auth/logout` | User | Logout (revoke refresh token) |

---

## Admin API (`/api/v1/admin/...`)

> All admin endpoints require a valid Bearer token with role `ADMIN` or `SUPER_ADMIN`.  
> `ADMIN` users are restricted to pages assigned via permissions.  
> `SUPER_ADMIN` has unrestricted access to all pages.

### Admins Management
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/admins` | `Admins` | List all admins |
| GET | `/admin/admins/{id}` | `Admins` | Get admin by ID |
| POST | `/admin/admins` | `SUPER_ADMIN` | Create new admin |
| PUT | `/admin/admins/{id}` | `SUPER_ADMIN` | Update admin |
| PATCH | `/admin/admins/{id}/status` | `SUPER_ADMIN` | Toggle admin status |
| GET | `/admin/admins/{id}/permissions` | `Admins` | Get admin page permissions |
| PUT | `/admin/admins/{id}/permissions` | `SUPER_ADMIN` | Assign page permissions |
| PATCH | `/admin/admins/{id}/permissions` | `SUPER_ADMIN` | Assign page permissions |

### Permissions
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/permissions` | Admin | List all available page permissions |

### Notifications
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/notifications` | `Notifications` | List all notifications |
| GET | `/admin/notifications/{id}` | `Notifications` | Get notification by ID |
| POST | `/admin/notifications` | `Notifications` | Create & send notification |
| DELETE | `/admin/notifications/{id}` | `Notifications` | Delete notification |

### Subscriptions
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/subscriptions` | `Subscriptions` | List all subscriptions |
| GET | `/admin/subscriptions/{id}` | `Subscriptions` | Get subscription by ID |
| POST | `/admin/subscriptions` | `Subscriptions` | Manually create subscription |
| PUT | `/admin/subscriptions/{id}` | `Subscriptions` | Update subscription |
| PATCH | `/admin/subscriptions/{id}/renew` | `Subscriptions` | Renew subscription |
| POST | `/admin/subscriptions/{id}/cancel` | `Subscriptions` | Cancel subscription |

### Subscription Plans
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/subscription-plans` | `Subscriptions` | List plans |
| GET | `/admin/subscription-plans/{id}` | `Subscriptions` | Get plan by ID |
| POST | `/admin/subscription-plans` | `Subscriptions` | Create plan |
| PUT | `/admin/subscription-plans/{id}` | `Subscriptions` | Update plan |
| PATCH | `/admin/subscription-plans/{id}/activate` | `Subscriptions` | Activate plan |
| PATCH | `/admin/subscription-plans/{id}/deactivate` | `Subscriptions` | Deactivate plan |

### Suggested Cafes
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/suggested-cafes` | `Suggested Cafes` | List suggestions |
| GET | `/admin/suggested-cafes/{id}` | `Suggested Cafes` | Get suggestion by ID |
| PUT | `/admin/suggested-cafes/{id}` | `Suggested Cafes` | Update suggestion |
| POST/PATCH | `/admin/suggested-cafes/{id}/approve` | `Suggested Cafes` | Approve suggestion |
| POST/PATCH | `/admin/suggested-cafes/{id}/reject` | `Suggested Cafes` | Reject suggestion |
| DELETE | `/admin/suggested-cafes/{id}` | `Suggested Cafes` | Delete suggestion |

### Cafes
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/cafes` | `Cafes` | List cafes |
| GET | `/admin/cafes/{id}` | `Cafes` | Get cafe by ID |
| PATCH | `/admin/cafes/{id}/approve` | `Cafes` | Approve cafe registration |
| PATCH | `/admin/cafes/{id}/reject` | `Cafes` | Reject cafe registration |

### Users / Customers / Cafe Owners
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/users` | `Customers`/`Cafe Owners` | List users |
| GET | `/admin/customers` | `Customers` | List customers |
| GET | `/admin/cafe-owners` | `Cafe Owners` | List cafe owners |
| PATCH | `/admin/users/{id}/status` | `SUPER_ADMIN` | Change user status |

### Complaints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/complaints` | `Complaints` | List all complaints |
| GET | `/admin/complaints/{id}` | `Complaints` | Get complaint by ID |
| PATCH | `/admin/complaints/{id}` | `Complaints` | Update complaint status |
| POST | `/admin/complaints/{id}/notify` | `Complaints` | Send notification to customer |
| POST | `/admin/complaints/{id}/resolve` | `Complaints` | Resolve complaint |
| POST | `/admin/complaints/{id}/transfer` | `Complaints` | Transfer complaint to cafe |

### Dashboard
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/admin/dashboard` | `Dashboard` | Get dashboard statistics |

---

## Mobile API (`/api/v1/mobile/...`)

> Public endpoints require no auth. Protected endpoints require a user Bearer token.

### Cafes (Public)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mobile/cafes` | None | List all approved cafes |
| GET | `/mobile/cafes/nearby` | None | Nearby cafes by lat/lng/radius |
| GET | `/mobile/cafes/{id}` | None | Get cafe details |
| GET | `/mobile/cafes/{id}/products` | None | Get cafe products |
| GET | `/mobile/cafes/{id}/offers` | None | Get cafe active offers |
| GET | `/mobile/cafes/{id}/events` | None | Get cafe published events |

### Global Feeds (Public)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mobile/offers` | None | All active offers feed |
| GET | `/mobile/offers/{id}` | None | Get offer details |
| GET | `/mobile/events` | None | All published events feed |
| GET | `/mobile/events/{id}` | None | Get event details |

### Notifications (Authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mobile/notifications` | User | User's targeted notification feed |

### Complaints (Authenticated Customer)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mobile/complaints` | Customer | List my complaints |
| GET | `/mobile/complaints/{id}` | Customer | Get complaint details |
| POST | `/mobile/complaints` | Customer | Submit new complaint |

### Subscriptions (Authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mobile/plans` | None | List active subscription plans |
| POST | `/mobile/subscriptions` | User | Subscribe to a plan |
| GET | `/mobile/subscriptions/me` | User | Get current active subscription |
| GET | `/mobile/subscriptions/history` | User | Subscription history |

### Suggested Cafes (Authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/mobile/suggested-cafes` | User | Submit a cafe suggestion |
