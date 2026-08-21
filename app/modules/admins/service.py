from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.admins.repository import AdminRepository
from app.modules.admins.schemas import AdminCreate, AdminUpdate, AssignPagePermissionsRequest
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate as UserCreateSchema
from app.modules.users.models import User
from app.core.exceptions import NotFoundException, ConflictException, BusinessException
from app.common.enums import UserRole, UserStatus, PagePermission


class AdminService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.admin_repository = AdminRepository(session)
        self.user_repository = UserRepository(session)
    
    async def list_admins(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[User], int]:
        status_enum = UserStatus(status) if status else None
        return await self.admin_repository.list_admins(status_enum, search, page, page_size)
    
    async def get_admin(self, admin_id: str) -> User:
        admin = await self.admin_repository.get_admin(admin_id)
        if not admin:
            raise NotFoundException("Admin not found")
        return admin
    
    async def create_admin(self, admin_create: AdminCreate, creator_role: UserRole) -> User:
        # Only SUPER_ADMIN can create admins
        if creator_role != UserRole.SUPER_ADMIN:
            raise BusinessException("Only SUPER_ADMIN can create admins")
        
        # Check if email already exists
        if await self.user_repository.email_exists(admin_create.email):
            raise ConflictException("Email already registered")
        
        # Check if phone already exists
        if admin_create.phone and await self.user_repository.phone_exists(admin_create.phone):
            raise ConflictException("Phone number already registered")
        
        user_create = UserCreateSchema(
            role=admin_create.role,
            full_name=admin_create.full_name,
            email=admin_create.email,
            phone=admin_create.phone,
            password=admin_create.password
        )
        
        return await self.user_repository.create(user_create)
    
    async def update_admin(self, admin_id: str, admin_update: AdminUpdate, updater_role: UserRole, updater_id: str) -> User:
        admin = await self.admin_repository.get_admin(admin_id)
        if not admin:
            raise NotFoundException("Admin not found")
        
        # Prevent self-lockout.
        if admin_id == updater_id and admin_update.status in {UserStatus.INACTIVE, UserStatus.SUSPENDED}:
            raise BusinessException("Cannot deactivate or suspend yourself")

        # Prevent removing the final active SUPER_ADMIN, but only when a
        # status or role change actually affects that account.
        is_deactivating = admin_update.status is not None and admin_update.status != UserStatus.ACTIVE
        is_demoting = admin_update.role is not None and admin_update.role != UserRole.SUPER_ADMIN
        if admin.role == UserRole.SUPER_ADMIN and (is_deactivating or is_demoting):
            active_super_admins = await self.admin_repository.count_super_admins_status(UserStatus.ACTIVE)
            if active_super_admins <= 1:
                raise BusinessException("Cannot deactivate or demote the last active SUPER_ADMIN")
        
        # Only SUPER_ADMIN can change roles
        if admin_update.role and admin_update.role != admin.role:
            if updater_role != UserRole.SUPER_ADMIN:
                raise BusinessException("Only SUPER_ADMIN can change admin roles")
        
        # Check if email already exists
        if admin_update.email and await self.user_repository.email_exists(admin_update.email, exclude_id=admin_id):
            raise ConflictException("Email already registered")
        
        # Check if phone already exists
        if admin_update.phone and await self.user_repository.phone_exists(admin_update.phone, exclude_id=admin_id):
            raise ConflictException("Phone number already registered")
        
        from app.modules.users.schemas import UserUpdate as UserUpdateSchema
        user_update = UserUpdateSchema(
            full_name=admin_update.full_name,
            email=admin_update.email,
            phone=admin_update.phone,
            status=admin_update.status
        )
        
        updated_user = await self.user_repository.update(admin, user_update)
        
        # Update role if changed
        if admin_update.role and admin_update.role != admin.role:
            updated_user.role = admin_update.role
            await self.session.flush()
            await self.session.refresh(updated_user)
        
        return updated_user
    
    async def get_admin_permissions(self, admin_id: str) -> List[PagePermission]:
        admin = await self.admin_repository.get_admin(admin_id)
        if not admin:
            raise NotFoundException("Admin not found")
        
        if admin.role == UserRole.SUPER_ADMIN:
            return list(PagePermission)
        
        permissions = await self.admin_repository.get_user_permissions(admin_id)
        return [p.page for p in permissions]
    
    async def assign_permissions(self, admin_id: str, request: AssignPagePermissionsRequest) -> List[PagePermission]:
        admin = await self.admin_repository.get_admin(admin_id)
        if not admin:
            raise NotFoundException("Admin not found")
        
        if admin.role == UserRole.SUPER_ADMIN:
            raise BusinessException("SUPER_ADMIN has all permissions by default")
        
        await self.admin_repository.replace_permissions(admin_id, request.pages)
        return request.pages
