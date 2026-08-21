import pytest
from unittest.mock import MagicMock, patch
from app.modules.auth.service import AuthService
from app.common.enums import UserRole, UserStatus
from app.core.exceptions import UnauthorizedException, InvalidGoogleTokenException


MOCK_GOOGLE_USER = {
    "sub": "google-id-123",
    "email": "googleuser@gmail.com",
    "name": "Google Test User",
    "email_verified": True,
    "picture": "https://example.com/photo.jpg",
}


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_oauth_provider")
async def test_google_login_new_customer(mock_get_provider, test_session):
    provider = MagicMock()
    provider.verify_token.return_value = MOCK_GOOGLE_USER
    mock_get_provider.return_value = provider

    service = AuthService(test_session)
    user, access_token, refresh_token = await service.google_login("fake-google-token")

    assert user.role == UserRole.CUSTOMER
    assert user.email == "googleuser@gmail.com"
    assert user.full_name == "Google Test User"
    assert user.google_id == "google-id-123"
    assert user.password_hash is None
    assert user.email_verified is True
    assert user.profile_image == "https://example.com/photo.jpg"
    assert user.last_login is not None
    assert access_token is not None
    assert refresh_token is not None


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_oauth_provider")
async def test_google_login_returning_user(mock_get_provider, test_session):
    provider = MagicMock()
    provider.verify_token.return_value = MOCK_GOOGLE_USER
    mock_get_provider.return_value = provider

    service = AuthService(test_session)
    user1, _, _ = await service.google_login("fake-google-token")
    user2, access_token, refresh_token = await service.google_login("fake-google-token")

    assert user1.id == user2.id
    assert access_token is not None
    assert refresh_token is not None


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_oauth_provider")
async def test_google_login_links_existing_email(mock_get_provider, test_session):
    from app.modules.auth.schemas import RegisterRequest

    service = AuthService(test_session)
    register_req = RegisterRequest(
        full_name="Password User",
        email="linktest@gmail.com",
        password="TestPass123!",
        role=UserRole.CUSTOMER,
    )
    existing_user, _, _ = await service.register(register_req)
    assert existing_user.google_id is None

    provider = MagicMock()
    provider.verify_token.return_value = {
        "sub": "google-id-link-456",
        "email": "linktest@gmail.com",
        "name": "Password User",
        "email_verified": True,
    }
    mock_get_provider.return_value = provider

    linked_user, access_token, refresh_token = await service.google_login("fake-google-token")

    assert linked_user.id == existing_user.id
    assert linked_user.google_id == "google-id-link-456"
    assert linked_user.email_verified is True
    assert access_token is not None


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_oauth_provider")
async def test_google_login_invalid_token(mock_get_provider, test_session):
    provider = MagicMock()
    provider.verify_token.return_value = None
    mock_get_provider.return_value = provider

    service = AuthService(test_session)
    with pytest.raises(InvalidGoogleTokenException):
        await service.google_login("invalid-token")


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_oauth_provider")
async def test_google_login_inactive_user(mock_get_provider, test_session):
    from app.modules.auth.schemas import RegisterRequest

    service = AuthService(test_session)
    register_req = RegisterRequest(
        full_name="Inactive User",
        email="inactive@gmail.com",
        password="TestPass123!",
        role=UserRole.CUSTOMER,
    )
    user, _, _ = await service.register(register_req)
    user.status = UserStatus.SUSPENDED
    await test_session.flush()

    provider = MagicMock()
    provider.verify_token.return_value = {
        "sub": "google-id-inactive",
        "email": "inactive@gmail.com",
        "name": "Inactive User",
        "email_verified": True,
    }
    mock_get_provider.return_value = provider

    with pytest.raises(UnauthorizedException):
        await service.google_login("fake-google-token")
