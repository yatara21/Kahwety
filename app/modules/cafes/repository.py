from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
from datetime import datetime, timezone
from app.modules.cafes.models import Cafe
from app.modules.cafes.schemas import CafeCreate, CafeUpdate
from app.common.enums import CafeRegistrationStatus


class CafeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, cafe_create: CafeCreate, owner_id: str) -> Cafe:
        cafe = Cafe(
            owner_id=owner_id,
            name=cafe_create.name,
            description=cafe_create.description,
            address=cafe_create.address,
            latitude=cafe_create.latitude,
            longitude=cafe_create.longitude,
            place_id=cafe_create.place_id,
            working_hours=cafe_create.working_hours,
            registration_status=CafeRegistrationStatus.PENDING,
            registration_date=datetime.now(timezone.utc),
            is_active=True
        )
        self.session.add(cafe)
        await self.session.flush()
        await self.session.refresh(cafe)
        return cafe
    
    async def get_by_id(self, cafe_id: str) -> Optional[Cafe]:
        result = await self.session.execute(select(Cafe).where(Cafe.id == cafe_id))
        return result.scalar_one_or_none()
    
    async def list_by_owner(
        self,
        owner_id: str,
        registration_status: Optional[CafeRegistrationStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        query = select(Cafe).where(Cafe.owner_id == owner_id)
        
        if registration_status:
            query = query.where(Cafe.registration_status == registration_status)
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Cafe.created_at.desc())
        
        result = await self.session.execute(query)
        cafes = result.scalars().all()
        
        return list(cafes), total
    
    async def list_all(
        self,
        registration_status: Optional[CafeRegistrationStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        query = select(Cafe)
        
        if registration_status:
            query = query.where(Cafe.registration_status == registration_status)
        
        if search:
            query = query.where(
                or_(
                    Cafe.name.ilike(f"%{search}%"),
                    Cafe.address.ilike(f"%{search}%")
                )
            )
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Cafe.created_at.desc())
        
        result = await self.session.execute(query)
        cafes = result.scalars().all()
        
        return list(cafes), total
    
    async def list_approved_active(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        from app.modules.subscriptions.models import Subscription
        from datetime import datetime, timezone

        # Owners with an active user subscription
        active_owner_subquery = select(Subscription.user_id).where(
            and_(
                Subscription.status == "ACTIVE",
                Subscription.expires_at.is_not(None),
                Subscription.expires_at > datetime.now(timezone.utc),
            )
        )

        query = select(Cafe).where(
            and_(
                Cafe.registration_status == CafeRegistrationStatus.APPROVED,
                Cafe.is_active == True,
                Cafe.owner_id.in_(active_owner_subquery),
            )
        )
        
        # Get total count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(Cafe.created_at.desc())
        
        result = await self.session.execute(query)
        cafes = result.scalars().all()
        
        return list(cafes), total
    
    async def list_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Cafe], int]:
        """List approved active cafes within a radius (km) using haversine distance.

        Foundation for the future nearby-cafes feature.
        """
        from sqlalchemy import func
        from app.modules.subscriptions.models import Subscription
        from datetime import datetime, timezone

        earth_radius_km = 6371.0
        lat1 = func.radians(latitude)
        lng1 = func.radians(longitude)
        lat2 = func.radians(Cafe.latitude)
        lng2 = func.radians(Cafe.longitude)
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = func.pow(func.sin(dlat / 2), 2) + func.cos(lat1) * func.cos(lat2) * func.pow(func.sin(dlng / 2), 2)
        distance_km = earth_radius_km * 2 * func.asin(func.sqrt(a))

        active_owner_subquery = select(Subscription.user_id).where(
            and_(
                Subscription.status == "ACTIVE",
                Subscription.expires_at.is_not(None),
                Subscription.expires_at > datetime.now(timezone.utc),
            )
        )

        query = select(Cafe, distance_km.label("distance_km")).where(
            and_(
                Cafe.latitude.isnot(None),
                Cafe.longitude.isnot(None),
                Cafe.registration_status == CafeRegistrationStatus.APPROVED,
                Cafe.is_active == True,
                Cafe.owner_id.in_(active_owner_subquery),
                distance_km <= radius_km,
            )
        )

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(distance_km.asc())

        result = await self.session.execute(query)
        rows = result.all()

        return [row[0] for row in rows], total

    async def update(self, cafe: Cafe, cafe_update: CafeUpdate) -> Cafe:
        if cafe_update.name is not None:
            cafe.name = cafe_update.name
        if cafe_update.description is not None:
            cafe.description = cafe_update.description
        if cafe_update.address is not None:
            cafe.address = cafe_update.address
        if cafe_update.latitude is not None:
            cafe.latitude = cafe_update.latitude
        if cafe_update.longitude is not None:
            cafe.longitude = cafe_update.longitude
        if cafe_update.place_id is not None:
            cafe.place_id = cafe_update.place_id
        if cafe_update.working_hours is not None:
            cafe.working_hours = cafe_update.working_hours
        if cafe_update.is_active is not None:
            cafe.is_active = cafe_update.is_active
        
        await self.session.flush()
        await self.session.refresh(cafe)
        return cafe
    
    async def approve(self, cafe: Cafe, approved_by: str) -> Cafe:
        cafe.registration_status = CafeRegistrationStatus.APPROVED
        cafe.approved_by = approved_by
        cafe.registration_date = datetime.now(timezone.utc)
        
        await self.session.flush()
        await self.session.refresh(cafe)
        return cafe
    
    async def reject(self, cafe: Cafe) -> Cafe:
        cafe.registration_status = CafeRegistrationStatus.REJECTED
        
        await self.session.flush()
        await self.session.refresh(cafe)
        return cafe
