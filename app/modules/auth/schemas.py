from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from app.common.enums import UserRole
from app.modules.users.schemas import UserResponse


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, examples=["John Doe"])
    email: EmailStr = Field(..., examples=["john@example.com"])
    phone: Optional[str] = Field(None, max_length=20, examples=["+201001234567"])
    password: str = Field(..., min_length=8, examples=["StrongPass123!"])
    role: UserRole = Field(default=UserRole.CUSTOMER, examples=["CUSTOMER"])


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., examples=["StrongPass123!"])


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., description="Google ID token from client-side Google Sign-In")


class SendOtpRequest(BaseModel):
    phone: str = Field(..., description="Phone number in E.164 format", examples=["+201001234567"])


class VerifyOtpRequest(BaseModel):
    phone: str = Field(..., description="Phone number in E.164 format", examples=["+201001234567"])
    code: str = Field(..., description="OTP code received via SMS", examples=["123456"])


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
