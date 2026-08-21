from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from app.modules.suggested_cafes.models import SuggestedCafe
from app.modules.suggested_cafes.schemas import SuggestedCafeCreate, SuggestedCafeUpdate
from app.common.enums import SuggestedCafeStatus


class SuggestedCafeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: SuggestedCafeCreate) -> SuggestedCafe:
        cafe = SuggestedCafe(
            owner_name=data.owner_name,
            city=data.city,
            phone=data.phone,
            google_link=data.google_link,
            website=data.website,
            facebook=data.facebook,
            instagram=data.instagram,
            telegram=data.telegram,
            status=SuggestedCafeStatus.NEW,
        )
        self.session.add(cafe)
        await self.session.flush()
        await self.session.refresh(cafe)
        return cafe

    async def get_by_id(self, cafe_id: str) -> Optional[SuggestedCafe]:
        result = await self.session.execute(
            select(SuggestedCafe).where(SuggestedCafe.id == cafe_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        status: Optional[SuggestedCafeStatus] = None,
        city: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[SuggestedCafe], int]:
        query = select(SuggestedCafe)

        if status:
            query = query.where(SuggestedCafe.status == status)
        if city:
            query = query.where(SuggestedCafe.city.ilike(f"%{city}%"))
        if search:
            query = query.where(
                SuggestedCafe.owner_name.ilike(f"%{search}%")
                | SuggestedCafe.phone.ilike(f"%{search}%")
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()

        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(SuggestedCafe.created_at.desc())

        result = await self.session.execute(query)
        cafes = result.scalars().all()

        return list(cafes), total

    async def update(self, cafe: SuggestedCafe, data: SuggestedCafeUpdate) -> SuggestedCafe:
        if data.owner_name is not None:
            cafe.owner_name = data.owner_name
        if data.city is not None:
            cafe.city = data.city
        if data.phone is not None:
            cafe.phone = data.phone
        if data.google_link is not None:
            cafe.google_link = data.google_link
        if data.status is not None:
            cafe.status = data.status
        if data.admin_notes is not None:
            cafe.admin_notes = data.admin_notes
        if data.website is not None:
            cafe.website = data.website
        if data.facebook is not None:
            cafe.facebook = data.facebook
        if data.instagram is not None:
            cafe.instagram = data.instagram
        if data.telegram is not None:
            cafe.telegram = data.telegram

        await self.session.flush()
        await self.session.refresh(cafe)
        return cafe

    async def delete(self, cafe: SuggestedCafe) -> None:
        await self.session.delete(cafe)
        await self.session.flush()
