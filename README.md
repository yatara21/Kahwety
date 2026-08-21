# Kahwety — Cafe Platform

Kahwety is a cafe management platform with three components:

- **Backend API** — Python 3.13 / FastAPI / SQLAlchemy (async) / Alembic / PostgreSQL 15
- **Admin Dashboard** — React 19 / Vite / TypeScript / Tailwind CSS (served as static files through Nginx)
- **Mobile Client** — Flutter, distributed separately, consumes the same versioned API (not part of the Docker stack)

## Table of contents

- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Run the API with Docker Compose](#run-the-api-with-docker-compose)
  - [Local development stack](#local-development-stack)
  - [Production stack](#production-stack)
- [Local development without Docker](#local-development-without-docker)
- [Environment variables](#environment-variables)
- [Authentication and roles](#authentication-and-roles)
- [API endpoints](#api-endpoints)
- [Testing the API](#testing-the-api)
  - [Swagger UI](#swagger-ui)
  - [Postman](#postman)
  - [curl walkthrough](#curl-walkthrough)
  - [Automated tests](#automated-tests)
- [Database and migrations](#database-and-migrations)
- [Backups and recovery](#backups-and-recovery)
- [Rollback](#rollback)
- [API security](#api-security)
- [Troubleshooting](#troubleshooting)

## Architecture

```text
Internet
  └─ Nginx (80/443)
       ├─ admin domain → static React dashboard
       └─ API domain   → FastAPI
                          └─ PostgreSQL
```

- Nginx is the only public entry point; the backend and PostgreSQL are only reachable on private Docker networks.
- A one-time `migrations` container applies Alembic migrations before the API starts.
- Redis is intentionally not deployed: the application does not use a shared cache, queue, or session store.

## Repository layout

```text
app/                        FastAPI application
  app/core/                 Config, security, permissions, rate limiting, exceptions
  app/common/               Shared enums, schemas, repositories
  app/services/             SMS (Twilio), Google auth, Moyasar payments integrations
  app/modules/              One folder per domain: auth, users, cafes, branches,
                            products, offers, events, complaints, subscriptions,
                            coupons, notifications, dashboard, mobile, ...
alembic/                    Database migrations (versions/)
frontend/                   React admin dashboard and production image
nginx/templates/            Host/domain-aware reverse-proxy configuration
tests/                      Automated backend tests (pytest)
scripts/                    Opt-in diagnostic, smoke-test, and seed scripts
resources/                  UI design mockups (PNG/PDF) — reference only
postman/, .postman/         Postman workspace files
CafePlatform.postman_collection.json   Importable Postman collection
docker-compose.yml          Production Compose stack (TLS-first)
docker-compose.dev.yml      Local development Compose stack (API + DB only)
```

## Run the API with Docker Compose

### Local development stack

`docker-compose.dev.yml` starts only PostgreSQL, migrations, and the API — no Nginx, domains, or TLS certificates are required. The API is published on `http://localhost:8000` and PostgreSQL on `127.0.0.1:5432`.

1. Create your environment file from the template:

   ```bash
   cp .env.example .env        # Windows PowerShell: copy .env.example .env
   ```

2. Edit `.env` for local use:

   ```env
   ENVIRONMENT=development
   DEBUG=true
   POSTGRES_USER=kahwety
   POSTGRES_PASSWORD=local-dev-password
   POSTGRES_DB=kahwety
   DATABASE_URL=postgresql+asyncpg://kahwety:local-dev-password@postgres:5432/kahwety
   SECRET_KEY=any-64-char-random-string-for-local-testing
   ```

   Leave the `TWILIO_*`, `GOOGLE_*`, and `MOYASAR_*` values empty for local development. Without Twilio credentials the app falls back to a log-based SMS provider (the dev OTP code is `123456`, printed in the API logs).

3. Start the stack:

   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   docker compose -f docker-compose.dev.yml ps
   docker compose -f docker-compose.dev.yml logs -f backend
   ```

4. Seed the super admin (first run only):

   ```bash
   docker compose -f docker-compose.dev.yml exec backend python scripts/seed_super_admin.py
   ```

5. Verify:

   ```bash
   curl http://localhost:8000/health    # {"status":"ok"}
   curl http://localhost:8000/ready     # {"status":"ready"}
   ```

   Interactive docs are available at `http://localhost:8000/docs`.

6. Stop the stack (database data survives in the `postgres_data_dev` volume):

   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

### Production stack

`docker-compose.yml` is the production stack: PostgreSQL + migrations + backend + frontend + Nginx with TLS. It requires two public DNS records and Let's Encrypt certificates before the first start.

1. **Prepare the VPS** — install Docker Engine and the Compose plugin, clone this repository to a protected directory such as `/srv/kahwety`, create `.env`, and allow only TCP 80/443 in the firewall. Do not publish PostgreSQL, backend, or frontend ports.

   Create DNS A records:

   ```text
   admin.example.com → VPS public IP
   api.example.com   → VPS public IP
   ```

   Set in `.env`:

   ```env
   ENVIRONMENT=production
   DEBUG=false
   ADMIN_DOMAIN=admin.your-domain.com
   API_DOMAIN=api.your-domain.com
   CORS_ORIGINS=https://admin.your-domain.com
   DATABASE_URL=postgresql+asyncpg://kahwety:<URL-ENCODED-DB-PASSWORD>@postgres:5432/kahwety
   ```

2. **Provision TLS certificates** — Nginx reads certificates from `/etc/letsencrypt` on the host. After DNS propagation:

   ```bash
   sudo certbot certonly --standalone \
     -d admin.your-domain.com \
     -d api.your-domain.com
   ```

   The certificate directory normally follows the first domain. If Certbot creates a different name, update the two certificate paths in `nginx/templates/default.conf.template`.

3. **Start the stack**:

   ```bash
   docker compose up -d --build
   docker compose ps
   docker compose logs --tail=100 migrations backend nginx
   ```

   The `migrations` service is expected to exit successfully; the running services are `postgres`, `backend`, `frontend`, and `nginx`.

4. **Verify** from the VPS and externally:

   ```bash
   curl -fsS https://api.your-domain.com/health
   curl -fsS https://api.your-domain.com/ready
   curl -I https://admin.your-domain.com/
   ```

5. **Seed the super admin** (first run only):

   ```bash
   docker compose exec backend python scripts/seed_super_admin.py
   ```

6. **Renew certificates** with a cron/system timer:

   ```bash
   sudo certbot renew --quiet --deploy-hook 'cd /srv/kahwety && docker compose exec -T nginx nginx -s reload'
   ```

   Test the renewal first with `sudo certbot renew --dry-run`.

Useful production commands:

```bash
docker compose logs -f backend
docker compose exec backend alembic current
docker compose run --rm migrations alembic current
docker compose down                 # preserves postgres_data
```

## Local development without Docker

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env
# Edit .env to point DATABASE_URL at a local PostgreSQL instance, then:
alembic upgrade head
python scripts/seed_super_admin.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Dashboard (second terminal):

```bash
cd frontend
npm ci
npm run dev
```

The local dashboard defaults to `http://localhost:8000/api/v1`. Use `npm run build` to validate the production bundle and `npm run lint` for linting.

## Environment variables

Copy `.env.example` to `.env` and replace every `CHANGE_`/`GENERATE_` value before deploying. Never commit `.env`.

| Variable | Purpose |
| --- | --- |
| `APP_NAME`, `ENVIRONMENT`, `DEBUG` | App identity and mode; production requires `ENVIRONMENT=production`, `DEBUG=false` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | PostgreSQL initialization (Compose) |
| `DATABASE_URL` | Async SQLAlchemy URL; host is `postgres` inside Compose |
| `DATABASE_POOL_SIZE`, `DATABASE_MAX_OVERFLOW`, `DATABASE_POOL_TIMEOUT_SECONDS` | Connection pool tuning |
| `SECRET_KEY` | At least 32 random bytes, e.g. `openssl rand -hex 32` |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | Token configuration |
| `CORS_ORIGINS` | Exact browser origin, normally `https://<ADMIN_DOMAIN>` |
| `LOG_LEVEL` | Application log level |
| `ADMIN_DOMAIN`, `API_DOMAIN` | Public dashboard and API hostnames (production Nginx) |
| `AUTH_LOGIN_RATE_LIMIT`, `AUTH_OTP_RATE_LIMIT`, `AUTH_RATE_LIMIT_WINDOW_SECONDS` | Login/OTP throttling per process |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Sign-In (optional) |
| `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SID`, `TWILIO_PHONE_NUMBER` | Twilio SMS/OTP (optional; without them a log-based dev provider is used outside production) |
| `MOYASAR_PUBLISHABLE_KEY`, `MOYASAR_SECRET_KEY`, `MOYASAR_WEBHOOK_SECRET`, `MOYASAR_BASE_URL`, `MOYASAR_CALLBACK_URL`, `MOYASAR_SUCCESS_URL`, `MOYASAR_BACK_URL` | Moyasar payments (optional; webhook secret is required when a secret key is configured) |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser Maps key for the dashboard build; restrict it to the dashboard domain |

When Twilio is configured on a **trial account**, SMS can only be delivered to numbers registered as Verified Caller IDs in the Twilio console (error 21608).

## Authentication and roles

**Roles** (`UserRole`): `CUSTOMER`, `CAFE_OWNER`, `ADMIN`, `SUPER_ADMIN`.
**Statuses**: `ACTIVE`, `INACTIVE`, `SUSPENDED` — only ACTIVE users can authenticate.

- JWT access + refresh tokens. `POST /auth/login` returns both; `POST /auth/refresh` rotates them; `POST /auth/logout` revokes the refresh token.
- Login and OTP endpoints are rate-limited per process.
- Public registration only allows `CUSTOMER` or `CAFE_OWNER`; ADMIN users are created by a SUPER_ADMIN via `POST /admins` or `POST /users`.
- ADMIN users have per-page permissions (`UserPagePermission`); SUPER_ADMIN bypasses all permission checks. Permission pages: Dashboard, Customers, Cafe Owners, Cafes, Products, Offers, Events, Subscriptions, Complaints, Notifications, Admins, Suggested Cafes.
- The Moyasar webhook is authenticated by a shared secret header (`X-Moyasar-Token` or `X-Webhook-Secret`), not JWT.

Auth notation used in the endpoint tables below:

| Marker | Meaning |
| --- | --- |
| Public | No authentication |
| User | Any authenticated ACTIVE user (JWT bearer) |
| Customer | Authenticated user with CUSTOMER role |
| Owner (own) | CAFE_OWNER, restricted to resources they own |
| Page perm | ADMIN with the listed page permission, or SUPER_ADMIN |
| Super admin | SUPER_ADMIN only |
| Webhook secret | `X-Moyasar-Token` / `X-Webhook-Secret` header |

All endpoints are prefixed with `/api/v1` except `/health` and `/ready`.

## API endpoints

### Health

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/health` | Liveness check | Public |
| GET | `/ready` | Readiness check (DB `SELECT 1`) | Public |

### Auth — `/api/v1/auth`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| POST | `/auth/register` | Register a customer or cafe owner | Public |
| POST | `/auth/login` | Login with email and password (rate-limited) | Public |
| POST | `/auth/google` | Login/register with a Google ID token | Public |
| POST | `/auth/send-otp` | Send an OTP to a phone number via Twilio Verify (rate-limited) | Public |
| POST | `/auth/verify-otp` | Verify an OTP code | Public |
| POST | `/auth/refresh` | Refresh the access token (rotation) | Public (valid refresh token) |
| GET | `/auth/me` | Current user profile | User |
| POST | `/auth/logout` | Revoke the refresh token | User |

### Users — `/api/v1/users`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/users` | List users (paginated, filter by status) | Admin (any) |
| GET | `/users/{user_id}` | Get user by ID | Admin (any) |
| POST | `/users` | Create a user | Admin (any) |
| PUT | `/users/{user_id}` | Update a user | Admin (any) |

### Customers — `/api/v1/customers`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/customers` | List customers with statistics | Page perm: Customers |
| GET | `/customers/{customer_id}` | Customer detail with statistics | Page perm: Customers |
| PUT | `/customers/{customer_id}` | Update customer | Page perm: Customers |

### Cafe owners — `/api/v1/cafe-owners`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/cafe-owners` | List cafe owners | Page perm: Cafe Owners |
| GET | `/cafe-owners/{owner_id}` | Get cafe owner | Page perm: Cafe Owners |
| PUT | `/cafe-owners/{owner_id}` | Update cafe owner | Page perm: Cafe Owners |

### Admins — `/api/v1/admins`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/admins` | List admins | Page perm: Admins |
| GET | `/admins/{admin_id}` | Get admin | Page perm: Admins |
| POST | `/admins` | Create an admin | Super admin |
| PUT | `/admins/{admin_id}` | Update admin | Page perm: Admins |
| GET | `/admins/{admin_id}/permissions` | List the admin's page permissions | Page perm: Admins |
| PUT | `/admins/{admin_id}/permissions` | Assign page permissions | Super admin |

### Cafes — `/api/v1/cafes`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/cafes/public` | List approved/active public cafes | Public |
| GET | `/cafes` | List all cafes (filter by registration status) | Page perm: Cafes |
| GET | `/cafes/nearby` | Cafes near a point (`latitude`, `longitude`, `radius_km`) | Public |
| GET | `/cafes/{cafe_id}` | Get cafe by ID | Public |
| POST | `/cafes` | Create cafe | Owner, or admin with Cafes page perm |
| PUT | `/cafes/{cafe_id}` | Update cafe | Owner (own) |
| POST | `/cafes/{cafe_id}/approve` | Approve cafe registration | Page perm: Cafes |
| POST | `/cafes/{cafe_id}/reject` | Reject cafe registration | Page perm: Cafes |

### Branches — `/api/v1/branches`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/branches/cafe/{cafe_id}` | List a cafe's branches | Public |
| GET | `/branches/{branch_id}` | Get branch | Public |
| POST | `/branches` | Create branch | Owner (own cafe), or admin with Cafes page perm |
| PUT | `/branches/{branch_id}` | Update branch | Owner (own) |
| DELETE | `/branches/{branch_id}` | Delete branch | Owner (own) |

### Products — `/api/v1/products`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/products/cafe/{cafe_id}` | List a cafe's products | Public |
| GET | `/products` | List all products | Page perm: Products |
| GET | `/products/{product_id}` | Get product | Public |
| POST | `/products` | Create product | Owner (own cafe) |
| PUT | `/products/{product_id}` | Update product | Owner (own) |
| DELETE | `/products/{product_id}` | Delete product | Owner (own) |

### Offers — `/api/v1/offers`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/offers/cafe/{cafe_id}` | List a cafe's offers (filter by status) | Public |
| GET | `/offers` | List all offers | Page perm: Offers |
| GET | `/offers/{offer_id}` | Get offer | Public |
| POST | `/offers` | Create offer | Owner (own cafe) |
| PUT | `/offers/{offer_id}` | Update offer | Owner (own) |
| DELETE | `/offers/{offer_id}` | Delete offer | Owner (own) |

### Events — `/api/v1/events`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/events/cafe/{cafe_id}` | List a cafe's events (filter by status) | Public |
| GET | `/events` | List all events | Page perm: Events |
| GET | `/events/{event_id}` | Get event | Public |
| POST | `/events` | Create event | Owner (own cafe) |
| PUT | `/events/{event_id}` | Update event | Owner (own) |
| DELETE | `/events/{event_id}` | Delete event | Owner (own) |

### Complaints — `/api/v1/complaints`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/complaints/customer/{customer_id}` | List a customer's complaints | Customer (own ID only) |
| GET | `/complaints/cafe/{cafe_id}` | List a cafe's complaints | Owner (own), or admin |
| GET | `/complaints` | List all complaints (filters: status, cafe, customer) | Page perm: Complaints |
| GET | `/complaints/{complaint_id}` | Get complaint | Customer (own) / Owner (own cafe) |
| POST | `/complaints` | Create complaint | Customer |
| PUT | `/complaints/{complaint_id}` | Update complaint | Page perm: Complaints |
| POST | `/complaints/{complaint_id}/send-notification` | Message the customer | Page perm: Complaints |
| POST | `/complaints/{complaint_id}/transfer` | Transfer complaint to a cafe | Page perm: Complaints |
| POST | `/complaints/{complaint_id}/resolve` | Resolve complaint | Page perm: Complaints |
| POST | `/complaints/{complaint_id}/cafe-reply` | Cafe owner reply | Owner (own cafe) |

### Subscription plans (admin) — `/api/v1/admin/subscription-plans`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/admin/subscription-plans` | List plans (filters: active, subscriber type, billing cycle) | Page perm: Subscriptions |
| GET | `/admin/subscription-plans/{plan_id}` | Get plan | Page perm: Subscriptions |
| POST | `/admin/subscription-plans` | Create plan | Page perm: Subscriptions |
| PUT | `/admin/subscription-plans/{plan_id}` | Update plan | Page perm: Subscriptions |
| PATCH | `/admin/subscription-plans/{plan_id}/activate` | Activate plan | Page perm: Subscriptions |
| PATCH | `/admin/subscription-plans/{plan_id}/deactivate` | Deactivate plan | Page perm: Subscriptions |

### Subscriptions (admin) — `/api/v1/admin/subscriptions`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/admin/subscriptions` | List subscriptions (filters: status, user) | Page perm: Subscriptions |
| GET | `/admin/subscriptions/{subscription_id}` | Get subscription | Page perm: Subscriptions |

### Coupons — `/api/v1/coupons`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/coupons` | List coupons (filter by active) | Page perm: Subscriptions |
| GET | `/coupons/{coupon_id}` | Get coupon | Page perm: Subscriptions |
| POST | `/coupons` | Create coupon | Page perm: Subscriptions |
| PUT | `/coupons/{coupon_id}` | Update coupon | Page perm: Subscriptions |
| DELETE | `/coupons/{coupon_id}` | Delete coupon | Page perm: Subscriptions |

### Notifications — `/api/v1/notifications`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/notifications` | List notifications (filters: target type/id) | Page perm: Notifications |
| GET | `/notifications/{notification_id}` | Get notification | Page perm: Notifications |
| POST | `/notifications` | Create notification | Page perm: Notifications |
| DELETE | `/notifications/{notification_id}` | Delete notification | Page perm: Notifications |

### Dashboard — `/api/v1/dashboard`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/dashboard` | Platform statistics | Page perm: Dashboard |

### Suggested cafes — `/api/v1/suggested-cafes`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/suggested-cafes` | List suggested cafes (filters: status, city, search) | Page perm: Suggested Cafes |
| GET | `/suggested-cafes/{cafe_id}` | Get suggested cafe | Page perm: Suggested Cafes |
| POST | `/suggested-cafes` | Create suggested cafe | Page perm: Suggested Cafes |
| PUT | `/suggested-cafes/{cafe_id}` | Update suggested cafe | Page perm: Suggested Cafes |
| POST | `/suggested-cafes/{cafe_id}/approve` | Approve suggested cafe | Page perm: Suggested Cafes |
| POST | `/suggested-cafes/{cafe_id}/reject` | Reject suggested cafe | Page perm: Suggested Cafes |
| DELETE | `/suggested-cafes/{cafe_id}` | Delete suggested cafe | Page perm: Suggested Cafes |

### Webhooks — `/api/v1/webhooks`

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| POST | `/webhooks/moyasar` | Moyasar payment callback; activates the subscription after server-side verification | Webhook secret header |

### Mobile API — `/api/v1/mobile` (Flutter client)

| Method | Path | Summary | Auth |
| --- | --- | --- | --- |
| GET | `/mobile/cafes` | List approved/active cafes | Public |
| GET | `/mobile/cafes/nearby` | Nearby cafes (`latitude`, `longitude`, `radius_km`) | Public |
| GET | `/mobile/cafes/{cafe_id}` | Public cafe detail (approved + active only) | Public |
| GET | `/mobile/cafes/{cafe_id}/products` | Cafe products (available only) | Public |
| GET | `/mobile/cafes/{cafe_id}/offers` | Cafe offers (ACTIVE only) | Public |
| GET | `/mobile/cafes/{cafe_id}/events` | Cafe events (PUBLISHED only) | Public |
| GET | `/mobile/complaints` | List own complaints (filter by status) | Customer |
| POST | `/mobile/complaints` | Create a complaint against a public cafe | Customer |
| GET | `/mobile/plans` | Active subscription plans (filter by subscriber type) | Public |
| POST | `/mobile/subscriptions` | Subscribe to a plan (initiates a Moyasar payment) | User (Customer or Cafe Owner) |
| GET | `/mobile/subscriptions/me` | Current subscription | User |
| GET | `/mobile/subscriptions/history` | Subscription history | User |

## Testing the API

### Swagger UI

FastAPI's interactive documentation is generated from the code and is the fastest way to try every endpoint:

- Local Docker dev stack: `http://localhost:8000/docs`
- Production: `https://api.your-domain.com/docs`

Click **Authorize** and paste an access token (`Bearer <token>`) to test protected endpoints directly from the browser. `/redoc` provides a browsable reference version.

### Postman

Import [CafePlatform.postman_collection.json](CafePlatform.postman_collection.json) (or the `postman/` workspace). Set the `apiOrigin` and `accessToken` variables in the collection or an environment:

1. `apiOrigin` — e.g. `http://localhost:8000` or `https://api.your-domain.com`
2. `accessToken` — the `access_token` value returned by `POST /auth/login`

The collection covers the current `/api/v1` routes, including mobile, subscription-plan, coupon, suggested-cafe, webhook, and health endpoints. Do not save real passwords, JWTs, payment credentials, or OAuth secrets in Postman.

### curl walkthrough

A complete happy-path test against a locally running API (`http://localhost:8000`):

```bash
# 1. Health
curl http://localhost:8000/health

# 2. Seed the super admin (once, inside the container or a local venv)
#    python scripts/seed_super_admin.py  → credentials are printed by the script

# 3. Login as super admin (use the credentials printed by the seed script)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<seeded-admin-email>","password":"<seeded-admin-password>"}'
# → note "access_token" from the response

TOKEN=<paste-access-token>

# 4. Who am I?
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Dashboard statistics (requires Dashboard page permission)
curl http://localhost:8000/api/v1/dashboard \
  -H "Authorization: Bearer $TOKEN"

# 6. Register a cafe owner
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Owner One","email":"owner@example.com","password":"StrongPass123!","role":"CAFE_OWNER","phone":"+966500000000"}'
# → note the returned id (or use GET /users)

# 7. Login as the cafe owner and create a cafe
OWNER_TOKEN=<owner-access-token>
curl -X POST http://localhost:8000/api/v1/cafes \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Riyadh Roasters","description":"Specialty coffee","city":"Riyadh","latitude":24.7136,"longitude":46.6753}'

# 8. Admin approves the cafe (registration_status is PENDING until approved)
curl -X POST http://localhost:8000/api/v1/cafes/<cafe_id>/approve \
  -H "Authorization: Bearer $TOKEN"

# 9. Public catalog endpoints
curl http://localhost:8000/api/v1/cafes/public
curl "http://localhost:8000/api/v1/cafes/nearby?latitude=24.7136&longitude=46.6753&radius_km=10"
curl http://localhost:8000/api/v1/mobile/cafes/<cafe_id>/products
```

**OTP flow testing.** With Twilio configured, `POST /api/v1/auth/send-otp` delivers a real SMS and `POST /api/v1/auth/verify-otp` checks it. Without Twilio credentials (non-production), the log-based provider is used: the OTP is always `123456` and is printed in the backend logs:

```bash
docker compose -f docker-compose.dev.yml logs backend | grep "DEV SMS"
```

**Webhook testing.** Send a signed request with the configured webhook secret:

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/moyasar \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $MOYASAR_WEBHOOK_SECRET" \
  -d '{"id":"evt_test","type":"payment.paid","data":{...}}'
```

Additional opt-in scripts (run with the backend environment active):

- `scripts/test_all_endpoints.py`, `scripts/test_new_endpoints.py` — endpoint smoke tests
- `scripts/e2e_subscription_smoke.py` — end-to-end subscription flow
- `scripts/test_moyasar_live.py` — Moyasar live integration test
- `scripts/live_smoke_suite.ps1` / `.sh` — live smoke suite against a running deployment
- `scripts/check_db_state.py`, `scripts/db_check.py`, `scripts/debug_500.py` — diagnostics

### Automated tests

The backend test suite uses pytest with an in-memory SQLite database (no PostgreSQL needed):

```bash
python -m pytest -q
```

Coverage includes auth (login, tokens, OTP, Google), permissions per role, API contracts, business logic, rate limiting, repositories, subscriptions/payments, and validation. Frontend verification:

```bash
cd frontend && npm run build
```

Validate the Compose files without starting anything:

```bash
docker compose --env-file .env.example config --quiet
docker compose -f docker-compose.dev.yml --env-file .env.example config --quiet
```

## Database and migrations

PostgreSQL data lives in the named `postgres_data` (production) / `postgres_data_dev` (local) Docker volumes and survives container recreation. Schema changes go through Alembic:

```bash
docker compose run --rm migrations alembic upgrade head   # production
docker compose exec backend alembic current
alembic revision --autogenerate -m "describe_change"       # development only
```

Do not run destructive downgrades automatically in production; validate upgrades and any downgrade path on a staging copy first.

## Backups and recovery

A Docker volume is not a backup. On the VPS, create an encrypted/off-host backup daily and retain multiple restore points:

```bash
mkdir -p backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "backups/kahwety-$(date +%F).sql.gz"
gzip -t backups/kahwety-YYYY-MM-DD.sql.gz
```

Copy verified backups to storage outside the VPS. Test restoration on a non-production database:

```bash
gunzip -c backups/kahwety-YYYY-MM-DD.sql.gz \
  | docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

For production recovery: stop the backend, restore a verified backup, run `alembic current`, restart, and validate `/ready`.

## Rollback

Before each deployment, retain the current images:

```bash
docker tag kahwety-backend:local kahwety-backend:previous
docker tag kahwety-frontend:local kahwety-frontend:previous
```

To roll back application code, retag the saved images as `:local` and run `docker compose up -d --no-build backend frontend nginx`. Application rollback does not automatically make a database migration safe to reverse — restore a database backup only after confirming migration compatibility. If Nginx fails to start, check `docker compose logs nginx`, fix the template or certificate path, then `docker compose up -d nginx`.

## API security

- All endpoints use explicit Pydantic response schemas, including the payment webhook. Password hashes, OAuth secrets, refresh-token records, payment metadata, and internal error details are never exposed.
- Token values are returned only by the authentication endpoints that need them.
- JWT type checks, account status checks, role/page permissions, resource ownership validation, and bounded pagination (`page_size` capped at 100).
- CORS permits only configured browser origins; it is not used as authorization.
- Login and OTP endpoints have process-local rate limits. For horizontally scaled API containers, replace the limiter with Redis-backed storage before increasing replicas.
- Public endpoints: `https://api.your-domain.com/api/v1` and `https://api.your-domain.com/docs`. The Flutter client calls the API origin directly and is not affected by browser CORS.

## Troubleshooting

- **`migrations` fails** — inspect `docker compose logs migrations`; check `DATABASE_URL`, PostgreSQL credentials, and migration compatibility.
- **Nginx fails at startup** — verify DNS, certificates under `/etc/letsencrypt/live`, and `ADMIN_DOMAIN`/`API_DOMAIN` values.
- **Dashboard cannot call the API** — rebuild the frontend after changing `API_DOMAIN`; Vite variables are build-time values.
- **Browser CORS error** — set `CORS_ORIGINS` to the exact HTTPS dashboard origin and recreate the backend container.
- **Twilio 403 / error 21608** — trial accounts can only send to verified numbers; add the destination as a Verified Caller ID in the Twilio console or upgrade the account.
- **OTP not delivered in local dev** — without Twilio credentials the dev provider logs the code (`123456`) instead of sending an SMS; check `docker compose logs backend`.
- **Authentication throttling triggered** — wait for the configured window; do not bypass it by trusting forwarded client-IP headers.

## Operational notes

Container logs go to stdout/stderr via `docker compose logs`. Do not log tokens, passwords, authorization headers, payment payloads, or integration credentials. Maintain a release record with deployed image IDs, migration revision, backup location, and verification results. If an OAuth client-secret file was ever copied into a working directory or source-control history, revoke and replace it in Google Cloud before deploying.
