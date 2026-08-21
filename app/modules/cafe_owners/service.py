from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.cafe_owners.repository import CafeOwnerRepository
from app.modules.cafe_owners.schemas import CafeOwnerUpdate
from app.modules.users.repository import UserRepository
from app.modules.users.models import User
from app.core.exceptions import NotFoundException, ConflictException


class CafeOwnerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.cafe_owner_repository = CafeOwnerRepository(session)
        self.user_repository = UserRepository(session)
    
    async def list_cafe_owners(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        from app.common.enums import UserStatus
        status_enum = UserStatus(status) if status else None
        return await self.cafe_owner_repository.list_cafe_owners(status_enum, search, page, page_size)
    
    async def get_cafe_owner(self, owner_id: str) -> User:
        owner = await self.cafe_owner_repository.get_cafe_owner(owner_id)
        if not owner:
            raise NotFoundException("Cafe owner not found")
        return owner
    
    async def update_cafe_owner(self, owner_id: str, owner_update: CafeOwnerUpdate) -> User:
        owner = await self.cafe_owner_repository.get_cafe_owner(owner_id)
        if not owner:
            raise NotFoundException("Cafe owner not found")
        
        from app.modules.users.schemas import UserUpdate as UserUpdateSchema
        from app.common.enums import UserStatus
        
        user_update = UserUpdateSchema(
            full_name=owner_update.full_name,
            email=owner_update.email,
            phone=owner_update.phone,
            status=UserStatus(owner_update.status) if owner_update.status else None
        )
        
        # Check if email already exists
        if user_update.email and await self.user_repository.email_exists(user_update.email, exclude_id=owner_id):
            raise ConflictException("Email already registered")
        
        # Check if phone already exists
        if user_update.phone and await self.user_repository.phone_exists(user_update.phone, exclude_id=owner_id):
            raise ConflictException("Phone number already registered")
        
        return await self.user_repository.update(owner, user_update)
