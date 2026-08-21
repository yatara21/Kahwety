from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.common.enums import UserRole, UserStatus


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)


class UserCreate(BaseModel):
    role: UserRole
    full_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=8)
    google_id: Optional[str] = None
    profile_image: Optional[str] = None
    email_verified: bool = False
    phone_verified: bool = False
    status: UserStatus = UserStatus.ACTIVE


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    status: Optional[UserStatus] = None
    profile_image: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    role: UserRole
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: UserStatus
    email_verified: bool
    phone_verified: bool
    profile_image: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
