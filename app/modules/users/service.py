from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.users.models import User
from app.core.exceptions import ConflictException, NotFoundException


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = UserRepository(session)
    
    async def create_user(self, user_create: UserCreate) -> User:
        # Check if email already exists
        if await self.repository.email_exists(user_create.email):
            raise ConflictException("Email already registered")
        
        # Check if phone already exists
        if user_create.phone and await self.repository.phone_exists(user_create.phone):
            raise ConflictException("Phone number already registered")
        
        return await self.repository.create(user_create)
    
    async def get_user(self, user_id: str) -> User:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user
    
    async def update_user(self, user_id: str, user_update: UserUpdate) -> User:
        user = await self.get_user(user_id)
        
        # Check if email already exists
        if user_update.email and await self.repository.email_exists(user_update.email, exclude_id=user_id):
            raise ConflictException("Email already registered")
        
        # Check if phone already exists
        if user_update.phone and await self.repository.phone_exists(user_update.phone, exclude_id=user_id):
            raise ConflictException("Phone number already registered")
        
        return await self.repository.update(user, user_update)
    
    async def list_users_by_role(
        self,
        role: str,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        from app.common.enums import UserRole, UserStatus
        role_enum = UserRole(role)
        status_enum = UserStatus(status) if status else None
        return await self.repository.list_by_role(role_enum, status_enum, search, page, page_size)
    
    async def list_all_users(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        from app.common.enums import UserStatus
        status_enum = UserStatus(status) if status else None
        return await self.repository.list_all(status_enum, search, page, page_size)