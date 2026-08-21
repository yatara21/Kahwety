from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.cafes.repository import CafeRepository
from app.modules.cafes.schemas import CafeCreate, CafeUpdate, CafeApprovalRequest
from app.modules.cafes.models import Cafe
from app.core.exceptions import NotFoundException, BusinessException, ForbiddenException
from app.common.enums import CafeRegistrationStatus


class CafeService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.cafe_repository = CafeRepository(session)
    
    async def create_cafe(self, cafe_create: CafeCreate, owner_id: str) -> Cafe:
        return await self.cafe_repository.create(cafe_create, owner_id)
    
    async def get_cafe(self, cafe_id: str) -> Cafe:
        cafe = await self.cafe_repository.get_by_id(cafe_id)
        if not cafe:
            raise NotFoundException("Cafe not found")
        return cafe

    async def ensure_owner_owns_cafe(self, cafe_id: str, owner_id: str) -> Cafe:
        cafe = await self.get_cafe(cafe_id)
        if cafe.owner_id != owner_id:
            raise ForbiddenException("You can only manage resources for your own cafes")
        return cafe
    
    async def list_cafes_by_owner(
        self,
        owner_id: str,
        registration_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        status_enum = CafeRegistrationStatus(registration_status) if registration_status else None
        return await self.cafe_repository.list_by_owner(owner_id, status_enum, page, page_size)
    
    async def list_all_cafes(
        self,
        registration_status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        status_enum = CafeRegistrationStatus(registration_status) if registration_status else None
        return await self.cafe_repository.list_all(status_enum, search, page, page_size)
    
    async def list_public_cafes(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        return await self.cafe_repository.list_approved_active(page, page_size)

    async def list_nearby_cafes(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        return await self.cafe_repository.list_nearby(latitude, longitude, radius_km, page, page_size)
    
    async def update_cafe(self, cafe_id: str, cafe_update: CafeUpdate) -> Cafe:
        cafe = await self.get_cafe(cafe_id)
        return await self.cafe_repository.update(cafe, cafe_update)
    
    async def approve_cafe(self, cafe_id: str, admin_id: str) -> Cafe:
        cafe = await self.get_cafe(cafe_id)
        
        if cafe.registration_status == CafeRegistrationStatus.APPROVED:
            raise BusinessException("Cafe is already approved")
        
        if cafe.registration_status == CafeRegistrationStatus.REJECTED:
            raise BusinessException("Cannot approve a rejected cafe")
        
        return await self.cafe_repository.approve(cafe, admin_id)
    
    async def reject_cafe(self, cafe_id: str) -> Cafe:
        cafe = await self.get_cafe(cafe_id)
        
        if cafe.registration_status == CafeRegistrationStatus.REJECTED:
            raise BusinessException("Cafe is already rejected")
        
        if cafe.registration_status == CafeRegistrationStatus.APPROVED:
            raise BusinessException("Cannot reject an approved cafe")
        
        return await self.cafe_repository.reject(cafe)
