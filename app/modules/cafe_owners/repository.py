from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from app.modules.users.models import User
from app.common.enums import UserRole, UserStatus


class CafeOwnerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def list_cafe_owners(
        self,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        query = select(User).where(User.role == UserRole.CAFE_OWNER)
        
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
    
    async def get_cafe_owner(self, owner_id: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.id == owner_id,
                    User.role == UserRole.CAFE_OWNER
                )
            )
        )
        return result.scalar_one_or_none()
