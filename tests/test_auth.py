import pytest
from app.modules.auth.service import AuthService
from app.modules.auth.schemas import RegisterRequest, LoginRequest
from app.core.exceptions import UnauthorizedException, ConflictException, ForbiddenException
from app.common.enums import UserRole


@pytest.mark.asyncio
async def test_register_customer(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"],
        role=UserRole.CUSTOMER,
    )
    user, access_token, refresh_token = await service.register(request)

    assert user.role == UserRole.CUSTOMER
    assert user.email == test_user_data["email"]
    assert user.full_name == test_user_data["full_name"]
    assert access_token is not None
    assert refresh_token is not None


@pytest.mark.asyncio
async def test_register_cafe_owner(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        password=test_user_data["password"],
        role=UserRole.CAFE_OWNER,
    )
    user, access_token, refresh_token = await service.register(request)

    assert user.role == UserRole.CAFE_OWNER
    assert access_token is not None


@pytest.mark.asyncio
async def test_register_admin_forbidden(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        password=test_user_data["password"],
        role=UserRole.ADMIN,
    )
    with pytest.raises(ForbiddenException):
        await service.register(request)


@pytest.mark.asyncio
async def test_register_duplicate_email(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        password=test_user_data["password"],
        role=UserRole.CUSTOMER,
    )
    await service.register(request)

    with pytest.raises(ConflictException):
        await service.register(request)


@pytest.mark.asyncio
async def test_login_success(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        password=test_user_data["password"],
        role=UserRole.CUSTOMER,
    )
    await service.register(request)

    login_request = LoginRequest(email=test_user_data["email"], password=test_user_data["password"])
    user, access_token, refresh_token = await service.login(login_request)

    assert user.email == test_user_data["email"]
    assert access_token is not None
    assert refresh_token is not None
    assert user.last_login is not None


@pytest.mark.asyncio
async def test_login_invalid_credentials(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        password=test_user_data["password"],
        role=UserRole.CUSTOMER,
    )
    await service.register(request)

    login_request = LoginRequest(email=test_user_data["email"], password="WrongPassword123!")
    with pytest.raises(UnauthorizedException):
        await service.login(login_request)


@pytest.mark.asyncio
async def test_refresh_token(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        password=test_user_data["password"],
        role=UserRole.CUSTOMER,
    )
    user, access_token, refresh_token = await service.register(request)

    new_user, new_access_token, new_refresh_token = await service.refresh(refresh_token)

    assert new_user.id == user.id
    assert new_access_token is not None
    assert new_refresh_token is not None
    assert new_refresh_token != refresh_token


@pytest.mark.asyncio
async def test_logout(test_session, test_user_data):
    service = AuthService(test_session)

    request = RegisterRequest(
        full_name=test_user_data["full_name"],
        email=test_user_data["email"],
        password=test_user_data["password"],
        role=UserRole.CUSTOMER,
    )
    user, access_token, refresh_token = await service.register(request)

    await service.logout(refresh_token)

    with pytest.raises(UnauthorizedException):
        await service.refresh(refresh_token)


@pytest.mark.asyncio
async def test_logout_cannot_revoke_another_users_token(test_session):
    service = AuthService(test_session)
    first_user, _, first_refresh_token = await service.register(
        RegisterRequest(
            full_name="First User",
            email="first@example.com",
            password="Password123!",
            role=UserRole.CUSTOMER,
        )
    )
    second_user, _, _ = await service.register(
        RegisterRequest(
            full_name="Second User",
            email="second@example.com",
            password="Password123!",
            role=UserRole.CUSTOMER,
        )
    )

    with pytest.raises(ForbiddenException):
        await service.logout(first_refresh_token, user_id=second_user.id)

    await service.refresh(first_refresh_token)
