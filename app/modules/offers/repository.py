from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.modules.offers.models import Offer
from app.modules.offers.schemas import OfferCreate, OfferUpdate


class OfferRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, offer_create: OfferCreate) -> Offer:
        offer = Offer(
            cafe_id=offer_create.cafe_id,
            title=offer_create.title,
            description=offer_create.description,
            discount_percentage=offer_create.discount_percentage,
            start_date=offer_create.start_date,
            end_date=offer_create.end_date,
            status=offer_create.status
        )
        self.session.add(offer)
        await self.session.flush()
        await self.session.refresh(offer)
        return offer
    
    async def get_by_id(self, offer_id: str) -> Optional[Offer]:
        result = await self.session.execute(select(Offer).where(Offer.id == offer_id))
        return result.scalar_one_or_none()
    
    async def list_by_cafe(
        self,
        cafe_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Offer], int]:
        query = select(Offer).where(Offer.cafe_id == cafe_id)
        
        if status:
            query = query.where(Offer.status == status)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Offer.created_at.desc())
        
        result = await self.session.execute(query)
        offers = result.scalars().all()
        
        return list(offers), total
    
    async def list_all(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Offer], int]:
        query = select(Offer)
        
        if status:
            query = query.where(Offer.status == status)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Offer.created_at.desc())
        
        result = await self.session.execute(query)
        offers = result.scalars().all()
        
        return list(offers), total
    
    async def update(self, offer: Offer, offer_update: OfferUpdate) -> Offer:
        if offer_update.title is not None:
            offer.title = offer_update.title
        if offer_update.description is not None:
            offer.description = offer_update.description
        if offer_update.discount_percentage is not None:
            offer.discount_percentage = offer_update.discount_percentage
        if offer_update.start_date is not None:
            offer.start_date = offer_update.start_date
        if offer_update.end_date is not None:
            offer.end_date = offer_update.end_date
        if offer_update.status is not None:
            offer.status = offer_update.status
        
        await self.session.flush()
        await self.session.refresh(offer)
        return offer
    
    async def delete(self, offer: Offer) -> None:
        await self.session.delete(offer)
        await self.session.flush()
