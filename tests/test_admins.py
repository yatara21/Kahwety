import pytest

from app.common.enums import UserRole
from app.modules.admins.schemas import AdminUpdate
from app.modules.admins.service import AdminService
from app.modules.users.schemas import UserCreate
from app.modules.users.service import UserService


@pytest.mark.asyncio
async def test_last_super_admin_can_update_profile_without_status_change(test_session):
    super_admin = await UserService(test_session).create_user(
        UserCreate(
            role=UserRole.SUPER_ADMIN,
            full_name="Primary Admin",
            email="primary-admin@example.com",
            password="Password123!",
        )
    )

    updated = await AdminService(test_session).update_admin(
        super_admin.id,
        AdminUpdate(full_name="Updated Primary Admin"),
        updater_role=UserRole.SUPER_ADMIN,
        updater_id=super_admin.id,
    )

    assert updated.full_name == "Updated Primary Admin"
