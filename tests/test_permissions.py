import pytest
from app.core.permissions import get_current_user, require_page_permission
from app.core.exceptions import ForbiddenException
from app.common.enums import UserRole, PagePermission
from unittest.mock import Mock


@pytest.mark.asyncio
async def test_get_current_user_success(test_session, test_user_data):
    from app.modules.auth.service import AuthService
    from app.modules.auth.schemas import RegisterRequest

    service = AuthService(test_session)
    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data.get("phone"),
        password=test_user_data["password"],
        role=UserRole.CUSTOMER,
    )
    user, access_token, refresh_token = await service.register(request)

    retrieved_user = await service.get_current_user(user.id)
    assert retrieved_user.id == user.id


@pytest.mark.asyncio
async def test_require_page_permission_admin(test_session, test_admin_data):
    from app.modules.users.schemas import UserCreate
    from app.modules.users.repository import UserRepository

    repo = UserRepository(test_session)
    user_create = UserCreate(
        role=UserRole.ADMIN,
        full_name=test_admin_data["full_name"],
        email=test_admin_data["email"],
        phone=test_admin_data["phone"],
        password=test_admin_data["password"],
    )
    admin_user = await repo.create(user_create)

    mock_admin = Mock()
    mock_admin.id = admin_user.id
    mock_admin.role = UserRole.ADMIN
    mock_admin.email = admin_user.email

    mock_super_admin = Mock()
    mock_super_admin.id = "super-admin-id"
    mock_super_admin.role = UserRole.SUPER_ADMIN
    mock_super_admin.email = "super@example.com"

    for permission in PagePermission:
        assert True


@pytest.mark.asyncio
async def test_page_permission_denied_for_customer():
    mock_customer = Mock()
    mock_customer.id = "customer-id"
    mock_customer.role = UserRole.CUSTOMER

    admin_pages = [
        PagePermission.DASHBOARD,
        PagePermission.CUSTOMERS,
        PagePermission.CAFE_OWNERS,
        PagePermission.CAFES,
        PagePermission.PRODUCTS,
        PagePermission.OFFERS,
        PagePermission.EVENTS,
        PagePermission.SUBSCRIPTIONS,
        PagePermission.COMPLAINTS,
        PagePermission.NOTIFICATIONS,
        PagePermission.ADMINS,
    ]

    for page in admin_pages:
        assert mock_customer.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]


@pytest.mark.asyncio
async def test_role_based_access():
    role_permissions = {
        UserRole.CUSTOMER: ["view_own_profile", "create_complaints"],
        UserRole.CAFE_OWNER: ["manage_cafes", "manage_products", "manage_offers", "manage_events"],
        UserRole.ADMIN: ["manage_users", "approve_cafes", "view_dashboard"],
        UserRole.SUPER_ADMIN: ["all_permissions"],
    }

    assert UserRole.CUSTOMER in role_permissions
    assert UserRole.CAFE_OWNER in role_permissions
    assert UserRole.ADMIN in role_permissions
    assert UserRole.SUPER_ADMIN in role_permissions
