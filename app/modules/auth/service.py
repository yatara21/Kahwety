from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.modules.auth.repository import RefreshTokenRepository
from app.modules.auth.schemas import RegisterRequest, LoginRequest
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate
from app.modules.users.models import User
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.exceptions import (
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    InvalidGoogleTokenException,
    OtpSendFailedException,
    OtpVerificationFailedException,
)
from app.common.enums import UserRole, UserStatus
from app.services.oauth import get_oauth_provider
from app.services.sms import get_sms_provider


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repository = UserRepository(session)
        self.refresh_token_repository = RefreshTokenRepository(session)

    def _generate_tokens(self, user: User) -> tuple[str, str]:
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        return access_token, refresh_token

    def _token_response(self, user: User, access_token: str, refresh_token: str):
        from app.modules.auth.schemas import TokenResponse, UserResponse

        return user, TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user),
        )

    async def register(self, request: RegisterRequest) -> tuple[User, str, str]:
        if request.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException("Admin registration is not allowed. Contact a Super Admin.")

        if await self.user_repository.email_exists(request.email):
            raise ConflictException("Email already registered")
        if request.phone and await self.user_repository.phone_exists(request.phone):
            raise ConflictException("Phone number already registered")

        user_create = UserCreate(
            role=request.role,
            full_name=request.full_name,
            email=request.email,
            phone=request.phone,
            password=request.password,
        )
        user = await self.user_repository.create(user_create)

        access_token, refresh_token = self._generate_tokens(user)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        await self.refresh_token_repository.create(user.id, refresh_token, expires_at)

        return user, access_token, refresh_token

    async def login(self, request: LoginRequest) -> tuple[User, str, str]:
        user = await self.user_repository.get_by_email(request.email)

        if not user or not user.password_hash:
            raise UnauthorizedException("Invalid credentials")

        if not verify_password(request.password, user.password_hash):
            raise UnauthorizedException("Invalid credentials")

        if user.status != UserStatus.ACTIVE:
            raise UnauthorizedException("User account is not active")

        await self.user_repository.update_last_login(user)

        access_token, refresh_token = self._generate_tokens(user)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        await self.refresh_token_repository.create(user.id, refresh_token, expires_at)

        return user, access_token, refresh_token

    async def google_login(self, id_token: str) -> tuple[User, str, str]:
        provider = get_oauth_provider()
        google_user = provider.verify_token(id_token)
        if not google_user:
            raise InvalidGoogleTokenException()

        google_id = google_user["sub"]
        email = google_user.get("email")
        name = google_user.get("name") or "Google User"
        picture = google_user.get("picture")

        existing_user = await self.user_repository.get_by_google_id(google_id)
        if existing_user:
            if existing_user.status != UserStatus.ACTIVE:
                raise UnauthorizedException("User account is not active")
            await self.user_repository.update_last_login(existing_user)
            access_token, refresh_token = self._generate_tokens(existing_user)
            expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
            await self.refresh_token_repository.create(existing_user.id, refresh_token, expires_at)
            return existing_user, access_token, refresh_token

        if email:
            email_user = await self.user_repository.get_by_email(email)
            if email_user:
                if email_user.status != UserStatus.ACTIVE:
                    raise UnauthorizedException("User account is not active")
                await self.user_repository.link_google_id(email_user, google_id)
                if picture:
                    email_user.profile_image = picture
                    await self.session.flush()
                await self.user_repository.update_last_login(email_user)
                access_token, refresh_token = self._generate_tokens(email_user)
                expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
                await self.refresh_token_repository.create(email_user.id, refresh_token, expires_at)
                return email_user, access_token, refresh_token

        new_user = await self.user_repository.create_google_user(
            role=UserRole.CUSTOMER,
            full_name=name,
            email=email or f"{google_id}@google.placeholder",
            google_id=google_id,
            profile_image=picture,
            email_verified=google_user.get("email_verified", False),
        )
        await self.user_repository.update_last_login(new_user)
        access_token, refresh_token = self._generate_tokens(new_user)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        await self.refresh_token_repository.create(new_user.id, refresh_token, expires_at)
        return new_user, access_token, refresh_token

    async def send_otp(self, phone: str) -> None:
        sms_provider = get_sms_provider()
        sent = await sms_provider.send_otp(phone, "")
        if not sent:
            raise OtpSendFailedException("Failed to send verification code. Please try again.")

    async def verify_otp(self, phone: str, code: str) -> User:
        sms_provider = get_sms_provider()
        verified = await sms_provider.verify_otp(phone, code)
        if not verified:
            raise OtpVerificationFailedException("Invalid or expired verification code.")

        user = await self.user_repository.get_by_phone(phone)
        if user:
            await self.user_repository.mark_phone_verified(user)
            return user

        return None

    async def refresh(self, refresh_token: str) -> tuple[User, str, str]:
        payload = decode_token(refresh_token)

        if payload is None:
            raise UnauthorizedException("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")

        token_record = await self.refresh_token_repository.get_by_token(refresh_token)
        if not token_record:
            raise UnauthorizedException("Refresh token not found or revoked")

        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise UnauthorizedException("Refresh token expired")

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User not found")

        if user.status != UserStatus.ACTIVE:
            raise UnauthorizedException("User account is not active")

        await self.refresh_token_repository.revoke(token_record)

        new_access_token, new_refresh_token = self._generate_tokens(user)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        await self.refresh_token_repository.create(user.id, new_refresh_token, expires_at)

        return user, new_access_token, new_refresh_token

    async def logout(self, refresh_token: str, user_id: Optional[str] = None) -> None:
        token_record = await self.refresh_token_repository.get_by_token(refresh_token)
        if token_record:
            if user_id is not None and token_record.user_id != user_id:
                raise ForbiddenException("Cannot revoke another user's session")
            await self.refresh_token_repository.revoke(token_record)

    async def get_current_user(self, user_id: str) -> User:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user
