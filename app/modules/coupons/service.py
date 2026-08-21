from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.modules.coupons.repository import CouponRepository
from app.modules.coupons.schemas import CouponCreate, CouponUpdate
from app.modules.coupons.models import Coupon
from app.core.exceptions import NotFoundException, ConflictException


class CouponService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.coupon_repository = CouponRepository(session)

    async def create_coupon(self, coupon_create: CouponCreate) -> Coupon:
        existing = await self.coupon_repository.get_by_code(coupon_create.code)
        if existing:
            raise ConflictException("Coupon code already exists")
        return await self.coupon_repository.create(coupon_create)

    async def get_coupon(self, coupon_id: str) -> Coupon:
        coupon = await self.coupon_repository.get_by_id(coupon_id)
        if not coupon:
            raise NotFoundException("Coupon not found")
        return coupon

    async def list_coupons(
        self,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Coupon], int]:
        return await self.coupon_repository.list_all(is_active, page, page_size)

    async def update_coupon(self, coupon_id: str, coupon_update: CouponUpdate) -> Coupon:
        coupon = await self.get_coupon(coupon_id)
        if coupon_update.code and coupon_update.code != coupon.code:
            existing = await self.coupon_repository.get_by_code(coupon_update.code)
            if existing:
                raise ConflictException("Coupon code already exists")
        return await self.coupon_repository.update(coupon, coupon_update)

    async def delete_coupon(self, coupon_id: str) -> None:
        coupon = await self.get_coupon(coupon_id)
        await self.coupon_repository.delete(coupon)
