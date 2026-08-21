from pydantic import ConfigDict, BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from app.common.enums import UserRole, UserStatus, PagePermission


class AdminResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdminCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = Field(default=UserRole.ADMIN)
    password: str = Field(..., min_length=8)


class AdminUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None


class PagePermissionResponse(BaseModel):
    id: str
    user_id: str
    page: PagePermission
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AssignPagePermissionsRequest(BaseModel):
    pages: List[PagePermission]