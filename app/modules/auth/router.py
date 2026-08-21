from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_async_session
from app.core.config import settings
from app.core.permissions import get_current_user
from app.core.rate_limit import enforce_login_rate_limit, enforce_otp_rate_limit
from app.modules.auth.service import AuthService
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    SendOtpRequest,
    VerifyOtpRequest,
    RefreshTokenRequest,
    TokenResponse,
    MessageResponse,
)
from app.modules.users.schemas import UserResponse
from app.common.responses import SuccessResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=SuccessResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new customer or cafe owner account. Admin registration is not allowed via this endpoint.",
    responses={
        409: {"description": "Email or phone already registered"},
        403: {"description": "Admin registration not allowed"},
        422: {"description": "Validation error"},
    },
)
async def register(
    request: RegisterRequest,
    session: AsyncSession = Depends(get_async_session),
):
    service = AuthService(session)
    user, access_token, refresh_token = await service.register(request)

    return SuccessResponse(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user),
        )
    )


@router.post(
    "/login",
    response_model=SuccessResponse[TokenResponse],
    summary="Login with email and password",
    description="Authenticate a user with email and password. Returns JWT access and refresh tokens.",
    responses={
        401: {"description": "Invalid credentials or inactive account"},
    },
)
async def login(
    request: LoginRequest,
    _: None = Depends(enforce_login_rate_limit),
    session: AsyncSession = Depends(get_async_session),
):
    service = AuthService(session)
    user, access_token, refresh_token = await service.login(request)

    return SuccessResponse(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user),
        )
    )


@router.post(
    "/google",
    response_model=SuccessResponse[TokenResponse],
    summary="Login or register with Google",
    description="Authenticate using a Google ID token. If the user exists, logs in. If the email exists, links the Google account. Otherwise, creates a new customer account.",
    responses={
        401: {"description": "Invalid Google token"},
    },
)
async def google_login(
    request: GoogleLoginRequest,
    session: AsyncSession = Depends(get_async_session),
):
    service = AuthService(session)
    user, access_token, refresh_token = await service.google_login(request.id_token)

    return SuccessResponse(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user),
        )
    )


@router.post(
    "/send-otp",
    response_model=SuccessResponse[MessageResponse],
    summary="Send OTP verification code",
    description="Send a one-time password (OTP) to the specified phone number via SMS using Twilio Verify.",
    responses={
        400: {"description": "Failed to send OTP"},
    },
)
async def send_otp(
    request: SendOtpRequest,
    _: None = Depends(enforce_otp_rate_limit),
    session: AsyncSession = Depends(get_async_session),
):
    service = AuthService(session)
    await service.send_otp(request.phone)

    return SuccessResponse(
        data=MessageResponse(message="OTP sent successfully")
    )


@router.post(
    "/verify-otp",
    response_model=SuccessResponse[MessageResponse],
    summary="Verify OTP code",
    description="Verify the OTP code sent to the phone number. If valid and the phone is linked to an existing user, marks the phone as verified.",
    responses={
        401: {"description": "Invalid or expired OTP code"},
    },
)
async def verify_otp(
    request: VerifyOtpRequest,
    _: None = Depends(enforce_otp_rate_limit),
    session: AsyncSession = Depends(get_async_session),
):
    service = AuthService(session)
    await service.verify_otp(request.phone, request.code)

    return SuccessResponse(
        data=MessageResponse(message="Phone verified successfully")
    )


@router.post(
    "/refresh",
    response_model=SuccessResponse[TokenResponse],
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access token and refresh token. The old refresh token is revoked (rotation).",
    responses={
        401: {"description": "Invalid, expired, or revoked refresh token"},
    },
)
async def refresh_token(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_async_session),
):
    service = AuthService(session)
    user, access_token, refresh_token = await service.refresh(request.refresh_token)

    return SuccessResponse(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user),
        )
    )


@router.get(
    "/me",
    response_model=SuccessResponse[UserResponse],
    summary="Get current user profile",
    description="Return the profile of the currently authenticated user.",
    responses={
        401: {"description": "Invalid or missing token"},
    },
)
async def get_me(
    current_user=Depends(get_current_user),
):
    return SuccessResponse(data=UserResponse.model_validate(current_user))


@router.post(
    "/logout",
    response_model=SuccessResponse[MessageResponse],
    summary="Logout (revoke refresh token)",
    description="Revoke the given refresh token so it can no longer be used to obtain new access tokens.",
)
async def logout(
    request: RefreshTokenRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    service = AuthService(session)
    await service.logout(request.refresh_token, user_id=current_user.id)
    return SuccessResponse(data=MessageResponse(message="Successfully logged out"))
