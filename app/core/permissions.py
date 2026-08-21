from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_async_session
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.modules.users.models import User
from app.modules.admins.models import UserPagePermission
from app.common.enums import UserRole, PagePermission


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_async_session)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise UnauthorizedException("Invalid token")
    
    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Invalid token payload")
    
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise UnauthorizedException("User not found")
    
    from app.common.enums import UserStatus
    if user.status != UserStatus.ACTIVE:
        raise UnauthorizedException("User is not active")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    from app.common.enums import UserStatus
    if current_user.status != UserStatus.ACTIVE:
        raise UnauthorizedException("User is not active")
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise ForbiddenException("Admin access required")
    return current_user


async def get_current_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise ForbiddenException("Super admin access required")
    return current_user


def require_role(*allowed_roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException("Insufficient permissions")
        return current_user
    return role_checker


def require_page_permission(page: PagePermission):
    async def permission_checker(
        current_user: User = Depends(get_current_admin),
        session: AsyncSession = Depends(get_async_session)
    ) -> User:
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
        
        page_val = page.value if hasattr(page, "value") else page
        result = await session.execute(
            select(UserPagePermission).where(
                UserPagePermission.user_id == current_user.id,
                UserPagePermission.page == page_val
            )
        )
        permission = result.scalar_one_or_none()
        
        if permission is None:
            raise ForbiddenException(f"Missing permission for page: {page_val}")
        
        return current_user
    return permission_checker


async def has_page_permission(session: AsyncSession, user: User, page: PagePermission) -> bool:
    """Return True if the user (admin/super admin) has permission for the given page."""
    if user.role == UserRole.SUPER_ADMIN:
        return True
    if user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        return False
    page_val = page.value if hasattr(page, "value") else page
    result = await session.execute(
        select(UserPagePermission).where(
            UserPagePermission.user_id == user.id,
            UserPagePermission.page == page_val
        )
    )
    return result.scalar_one_or_none() is not None
