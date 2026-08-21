import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.modules.auth.service import AuthService
from app.core.exceptions import OtpSendFailedException, OtpVerificationFailedException
from app.common.enums import UserRole


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_sms_provider")
async def test_send_otp_success(mock_get_sms, test_session):
    sms_provider = AsyncMock()
    sms_provider.send_otp.return_value = True
    mock_get_sms.return_value = sms_provider

    service = AuthService(test_session)
    await service.send_otp("+201001234567")

    sms_provider.send_otp.assert_called_once_with("+201001234567", "")


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_sms_provider")
async def test_send_otp_failure(mock_get_sms, test_session):
    sms_provider = AsyncMock()
    sms_provider.send_otp.return_value = False
    mock_get_sms.return_value = sms_provider

    service = AuthService(test_session)
    with pytest.raises(OtpSendFailedException):
        await service.send_otp("+201001234567")


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_sms_provider")
async def test_verify_otp_success(mock_get_sms, test_session):
    from app.modules.auth.schemas import RegisterRequest

    service = AuthService(test_session)
    register_req = RegisterRequest(
        full_name="Phone User",
        email="phone@example.com",
        phone="+201001234567",
        password="TestPass123!",
        role=UserRole.CUSTOMER,
    )
    await service.register(register_req)

    sms_provider = AsyncMock()
    sms_provider.verify_otp.return_value = True
    mock_get_sms.return_value = sms_provider

    user = await service.verify_otp("+201001234567", "123456")

    assert user is not None
    assert user.phone_verified is True
    sms_provider.verify_otp.assert_called_once_with("+201001234567", "123456")


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_sms_provider")
async def test_verify_otp_wrong_code(mock_get_sms, test_session):
    sms_provider = AsyncMock()
    sms_provider.verify_otp.return_value = False
    mock_get_sms.return_value = sms_provider

    service = AuthService(test_session)
    with pytest.raises(OtpVerificationFailedException):
        await service.verify_otp("+201001234567", "000000")


@pytest.mark.asyncio
@patch("app.modules.auth.service.get_sms_provider")
async def test_verify_otp_no_existing_user(mock_get_sms, test_session):
    sms_provider = AsyncMock()
    sms_provider.verify_otp.return_value = True
    mock_get_sms.return_value = sms_provider

    service = AuthService(test_session)
    result = await service.verify_otp("+99999999999", "123456")

    assert result is None
