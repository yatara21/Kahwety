import pytest
from pydantic import ValidationError
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.auth.schemas import RegisterRequest, LoginRequest
from app.modules.cafes.schemas import CafeCreate, CafeUpdate
from app.common.enums import UserRole


def test_user_create_validation():
    valid_data = {
        "role": UserRole.CUSTOMER,
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": "+1234567890",
        "password": "Password123!",
    }
    user = UserCreate(**valid_data)
    assert user.email == "test@example.com"

    with pytest.raises(ValidationError):
        UserCreate(**{**valid_data, "email": "invalid-email"})

    with pytest.raises(ValidationError):
        UserCreate(**{**valid_data, "password": "short"})


def test_user_update_validation():
    valid_data = {
        "full_name": "Updated Name",
        "email": "updated@example.com",
    }
    user_update = UserUpdate(**valid_data)
    assert user_update.full_name == "Updated Name"

    with pytest.raises(ValidationError):
        UserUpdate(**{**valid_data, "email": "invalid-email"})


def test_register_request_validation():
    valid_data = {
        "full_name": "Test Customer",
        "email": "customer@example.com",
        "phone": "+1234567890",
        "password": "Password123!",
        "role": UserRole.CUSTOMER,
    }
    request = RegisterRequest(**valid_data)
    assert request.email == "customer@example.com"

    with pytest.raises(ValidationError):
        RegisterRequest(**{k: v for k, v in valid_data.items() if k != "email"})

    with pytest.raises(ValidationError):
        RegisterRequest(**{**valid_data, "password": "short"})


def test_login_validation():
    valid_data = {
        "email": "test@example.com",
        "password": "Password123!",
    }
    request = LoginRequest(**valid_data)
    assert request.email == "test@example.com"

    with pytest.raises(ValidationError):
        LoginRequest(**{k: v for k, v in valid_data.items() if k != "email"})

    with pytest.raises(ValidationError):
        LoginRequest(**{k: v for k, v in valid_data.items() if k != "password"})


def test_cafe_create_validation():
    valid_data = {
        "name": "Test Cafe",
        "description": "A test cafe",
        "address": "123 Main St",
        "latitude": 40.7128,
        "longitude": -74.0060,
    }
    cafe = CafeCreate(**valid_data)
    assert cafe.name == "Test Cafe"

    with pytest.raises(ValidationError):
        CafeCreate(**{**valid_data, "latitude": 100})

    with pytest.raises(ValidationError):
        CafeCreate(**{**valid_data, "longitude": 200})

    with pytest.raises(ValidationError):
        CafeCreate(**{k: v for k, v in valid_data.items() if k != "name"})


def test_cafe_update_validation():
    valid_data = {
        "name": "Updated Cafe",
        "is_active": False,
    }
    cafe_update = CafeUpdate(**valid_data)
    assert cafe_update.name == "Updated Cafe"

    with pytest.raises(ValidationError):
        CafeUpdate(**{**valid_data, "latitude": 100})


def test_email_format_validation():
    valid_emails = [
        "test@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
    ]

    invalid_emails = [
        "invalid",
        "@example.com",
        "user@",
        "user @example.com",
    ]

    for email in valid_emails:
        UserCreate(
            role=UserRole.CUSTOMER,
            full_name="Test",
            email=email,
            password="Password123!",
        )

    for email in invalid_emails:
        with pytest.raises(ValidationError):
            UserCreate(
                role=UserRole.CUSTOMER,
                full_name="Test",
                email=email,
                password="Password123!",
            )


def test_password_strength_validation():
    valid_passwords = [
        "Password123!",
        "StrongP@ssw0rd",
        "MySecure#123",
    ]

    invalid_passwords = [
        "short",
        "1234567",
        "Pass1",
    ]

    for password in valid_passwords:
        RegisterRequest(
            full_name="Test",
            email="test@example.com",
            password=password,
            role=UserRole.CUSTOMER,
        )

    for password in invalid_passwords:
        with pytest.raises(ValidationError):
            RegisterRequest(
                full_name="Test",
                email="test@example.com",
                password=password,
                role=UserRole.CUSTOMER,
            )
