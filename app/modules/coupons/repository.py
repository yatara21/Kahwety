from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from app.modules.coupons.models import Coupon
from app.modules.coupons.schemas import CouponCreate, CouponUpdate


class CouponRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, coupon_create: CouponCreate) -> Coupon:
        coupon = Coupon(
            code=coupon_create.code,
            discount_percent=coupon_create.discount_percent,
            plan_id=coupon_create.plan_id,
            max_uses=coupon_create.max_uses,
            used_count=0,
            start_date=coupon_create.start_date,
            end_date=coupon_create.end_date,
            is_active=coupon_create.is_active,
        )
        self.session.add(coupon)
        await self.session.flush()
        await self.session.refresh(coupon)
        return coupon

    async def get_by_id(self, coupon_id: str) -> Optional[Coupon]:
        result = await self.session.execute(
            select(Coupon).where(Coupon.id == coupon_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Coupon]:
        result = await self.session.execute(
            select(Coupon).where(Coupon.code == code)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Coupon], int]:
        query = select(Coupon)
        if is_active is not None:
            query = query.where(Coupon.is_active == is_active)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()

        query = query.order_by(Coupon.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(query)
        coupons = list(result.scalars().all())
        return coupons, total

    async def update(self, coupon: Coupon, coupon_update: CouponUpdate) -> Coupon:
        if coupon_update.code is not None:
            coupon.code = coupon_update.code
        if coupon_update.discount_percent is not None:
            coupon.discount_percent = coupon_update.discount_percent
        if coupon_update.plan_id is not None:
            coupon.plan_id = coupon_update.plan_id
        if coupon_update.max_uses is not None:
            coupon.max_uses = coupon_update.max_uses
        if coupon_update.start_date is not None:
            coupon.start_date = coupon_update.start_date
        if coupon_update.end_date is not None:
            coupon.end_date = coupon_update.end_date
        if coupon_update.is_active is not None:
            coupon.is_active = coupon_update.is_active
        await self.session.flush()
        await self.session.refresh(coupon)
        return coupon

    async def delete(self, coupon: Coupon) -> None:
        await self.session.delete(coupon)
        await self.session.flush()
