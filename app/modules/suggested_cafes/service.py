from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.suggested_cafes.repository import SuggestedCafeRepository
from app.modules.suggested_cafes.schemas import SuggestedCafeCreate, SuggestedCafeUpdate
from app.modules.suggested_cafes.models import SuggestedCafe
from app.core.exceptions import NotFoundException
from app.common.enums import SuggestedCafeStatus


class SuggestedCafeService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = SuggestedCafeRepository(session)

    async def create(self, data: SuggestedCafeCreate) -> SuggestedCafe:
        return await self.repository.create(data)

    async def get(self, cafe_id: str) -> SuggestedCafe:
        cafe = await self.repository.get_by_id(cafe_id)
        if not cafe:
            raise NotFoundException("Suggested cafe not found")
        return cafe

    async def list_all(
        self,
        status: Optional[str] = None,
        city: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[SuggestedCafe], int]:
        status_enum = SuggestedCafeStatus(status) if status else None
        return await self.repository.list_all(status_enum, city, search, page, page_size)

    async def update(self, cafe_id: str, data: SuggestedCafeUpdate) -> SuggestedCafe:
        cafe = await self.get(cafe_id)
        return await self.repository.update(cafe, data)

    async def approve(self, cafe_id: str) -> SuggestedCafe:
        cafe = await self.get(cafe_id)
        update = SuggestedCafeUpdate(status=SuggestedCafeStatus.APPROVED)
        return await self.repository.update(cafe, update)

    async def reject(self, cafe_id: str) -> SuggestedCafe:
        cafe = await self.get(cafe_id)
        update = SuggestedCafeUpdate(status=SuggestedCafeStatus.REJECTED)
        return await self.repository.update(cafe, update)

    async def delete(self, cafe_id: str) -> None:
        cafe = await self.get(cafe_id)
        await self.repository.delete(cafe)
