from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete
from typing import Optional, List
from app.modules.users.models import User
from app.modules.admins.models import UserPagePermission
from app.common.enums import UserRole, UserStatus, PagePermission


class AdminRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def list_admins(
        self,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        query = select(User).where(
            or_(User.role == UserRole.ADMIN, User.role == UserRole.SUPER_ADMIN)
        )
        
        if status:
            query = query.where(User.status == status)
        
        if search:
            query = query.where(
                User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
            )
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(User.created_at.desc())
        
        result = await self.session.execute(query)
        users = result.scalars().all()
        
        return list(users), total
    
    async def get_admin(self, admin_id: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.id == admin_id,
                    or_(User.role == UserRole.ADMIN, User.role == UserRole.SUPER_ADMIN)
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def count_super_admins_status(self, status: UserStatus) -> int:
        from sqlalchemy import func
        result = await self.session.execute(
            select(func.count()).where(
                and_(
                    User.role == UserRole.SUPER_ADMIN,
                    User.status == status
                )
            )
        )
        return result.scalar()
    
    async def get_user_permissions(self, user_id: str) -> List[UserPagePermission]:
        result = await self.session.execute(
            select(UserPagePermission).where(UserPagePermission.user_id == user_id)
        )
        return list(result.scalars().all())
    
    async def assign_permission(self, user_id: str, page: PagePermission) -> UserPagePermission:
        permission = UserPagePermission(user_id=user_id, page=page)
        self.session.add(permission)
        await self.session.flush()
        await self.session.refresh(permission)
        return permission
    
    async def remove_permission(self, user_id: str, page: PagePermission) -> None:
        await self.session.execute(
            delete(UserPagePermission).where(
                and_(
                    UserPagePermission.user_id == user_id,
                    UserPagePermission.page == page
                )
            )
        )
        await self.session.flush()
    
    async def replace_permissions(self, user_id: str, pages: List[PagePermission]) -> List[UserPagePermission]:
        # Delete existing permissions
        await self.session.execute(
            delete(UserPagePermission).where(UserPagePermission.user_id == user_id)
        )
        
        # Add new permissions
        permissions = []
        for page in pages:
            permission = UserPagePermission(user_id=user_id, page=page)
            self.session.add(permission)
            permissions.append(permission)
        
        await self.session.flush()
        
        # Refresh all permissions
        for permission in permissions:
            await self.session.refresh(permission)
        
        return permissions
