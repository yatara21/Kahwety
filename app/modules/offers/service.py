from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.offers.repository import OfferRepository
from app.modules.offers.schemas import OfferCreate, OfferUpdate
from app.modules.offers.models import Offer
from app.core.exceptions import NotFoundException, ValidationException


class OfferService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.offer_repository = OfferRepository(session)
    
    async def create_offer(self, offer_create: OfferCreate) -> Offer:
        # Validate end_date is after start_date
        if offer_create.end_date <= offer_create.start_date:
            raise ValidationException("End date must be after start date")
        
        return await self.offer_repository.create(offer_create)
    
    async def get_offer(self, offer_id: str) -> Offer:
        offer = await self.offer_repository.get_by_id(offer_id)
        if not offer:
            raise NotFoundException("Offer not found")
        return offer
    
    async def list_offers_by_cafe(
        self,
        cafe_id: str,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Offer], int]:
        return await self.offer_repository.list_by_cafe(cafe_id, status, page, page_size)
    
    async def list_all_offers(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Offer], int]:
        return await self.offer_repository.list_all(status, page, page_size)
    
    async def update_offer(self, offer_id: str, offer_update: OfferUpdate) -> Offer:
        offer = await self.get_offer(offer_id)
        
        # Validate end_date is after start_date if both are provided
        if offer_update.start_date and offer_update.end_date:
            if offer_update.end_date <= offer_update.start_date:
                raise ValidationException("End date must be after start date")
        
        return await self.offer_repository.update(offer, offer_update)
    
    async def delete_offer(self, offer_id: str) -> None:
        offer = await self.get_offer(offer_id)
        await self.offer_repository.delete(offer)
