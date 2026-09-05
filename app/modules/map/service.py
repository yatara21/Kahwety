import math
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.common.enums import CafeRegistrationStatus
from app.modules.cafes.models import Cafe
from app.modules.branches.models import Branch
from app.modules.offers.models import Offer
from app.modules.events.models import Event
from app.modules.map.schemas import CafeMapMarker, CafeMapResponse


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class MapService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_map_markers(
        self,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[float] = None,
        search: Optional[str] = None,
        city: Optional[str] = None,
        has_offers: Optional[bool] = None,
        has_events: Optional[bool] = None,
        bounds_north: Optional[float] = None,
        bounds_south: Optional[float] = None,
        bounds_east: Optional[float] = None,
        bounds_west: Optional[float] = None,
        cafe_id: Optional[str] = None,
    ) -> CafeMapResponse:
        """Fetch all approved & active cafes and branches with coordinates for Google Maps display."""
        # 1. Fetch active offers count per cafe
        offers_query = (
            select(Offer.cafe_id, func.count(Offer.id).label("count"))
            .where(Offer.status == "ACTIVE")
            .group_by(Offer.cafe_id)
        )
        offers_result = await self.session.execute(offers_query)
        offers_count_map = {row.cafe_id: row.count for row in offers_result.all()}

        # 2. Fetch active events count per cafe
        events_query = (
            select(Event.cafe_id, func.count(Event.id).label("count"))
            .where(Event.status == "PUBLISHED")
            .group_by(Event.cafe_id)
        )
        events_result = await self.session.execute(events_query)
        events_count_map = {row.cafe_id: row.count for row in events_result.all()}

        # 3. Fetch approved and active cafes
        cafe_stmt = select(Cafe).where(
            and_(
                Cafe.registration_status == CafeRegistrationStatus.APPROVED,
                Cafe.is_active == True,
            )
        )
        if cafe_id:
            cafe_stmt = cafe_stmt.where(Cafe.id == cafe_id)

        cafes_res = await self.session.execute(cafe_stmt)
        cafes_list = list(cafes_res.scalars().all())
        cafe_by_id = {c.id: c for c in cafes_list}

        # 4. Fetch branches belonging to approved active cafes
        branch_stmt = (
            select(Branch)
            .join(Cafe, Branch.cafe_id == Cafe.id)
            .where(
                and_(
                    Cafe.registration_status == CafeRegistrationStatus.APPROVED,
                    Cafe.is_active == True,
                )
            )
        )
        if cafe_id:
            branch_stmt = branch_stmt.where(Branch.cafe_id == cafe_id)

        branches_res = await self.session.execute(branch_stmt)
        branches_list = list(branches_res.scalars().all())

        markers: List[CafeMapMarker] = []

        # Process Main Cafe Locations
        for cafe in cafes_list:
            if cafe.latitude is not None and cafe.longitude is not None:
                dist = None
                if latitude is not None and longitude is not None:
                    dist = calculate_haversine_distance(latitude, longitude, cafe.latitude, cafe.longitude)

                # Filter by radius
                if radius_km is not None and dist is not None and dist > radius_km:
                    continue

                # Filter by bounding box
                if bounds_north is not None and bounds_south is not None:
                    if not (bounds_south <= cafe.latitude <= bounds_north):
                        continue
                if bounds_east is not None and bounds_west is not None:
                    if not (bounds_west <= cafe.longitude <= bounds_east):
                        continue

                # Filter by search
                if search:
                    s_lower = search.lower()
                    if s_lower not in cafe.name.lower() and s_lower not in cafe.address.lower() and s_lower not in (cafe.description or "").lower():
                        continue

                # Filter by city
                if city:
                    if city.lower() not in cafe.address.lower():
                        continue

                num_offers = offers_count_map.get(cafe.id, 0)
                num_events = events_count_map.get(cafe.id, 0)

                if has_offers is True and num_offers == 0:
                    continue
                if has_events is True and num_events == 0:
                    continue

                markers.append(
                    CafeMapMarker(
                        id=f"cafe_{cafe.id}",
                        marker_type="cafe",
                        cafe_id=cafe.id,
                        branch_id=None,
                        name=cafe.name,
                        branch_name=None,
                        display_title=cafe.name,
                        description=cafe.description,
                        address=cafe.address,
                        latitude=cafe.latitude,
                        longitude=cafe.longitude,
                        place_id=cafe.place_id,
                        logo_url=getattr(cafe, "logo_url", None),
                        cover_image_url=getattr(cafe, "cover_image_url", None),
                        phone=getattr(cafe, "phone", None),
                        rating=4.8,
                        working_hours=cafe.working_hours,
                        is_open_now=True,
                        distance_km=dist,
                        google_maps_url=f"https://www.google.com/maps/search/?api=1&query={cafe.latitude},{cafe.longitude}",
                        active_offers_count=num_offers,
                        active_events_count=num_events,
                    )
                )

        # Process Branches
        for branch in branches_list:
            if branch.latitude is not None and branch.longitude is not None:
                parent_cafe = cafe_by_id.get(branch.cafe_id)
                if not parent_cafe:
                    continue

                dist = None
                if latitude is not None and longitude is not None:
                    dist = calculate_haversine_distance(latitude, longitude, branch.latitude, branch.longitude)

                # Filter by radius
                if radius_km is not None and dist is not None and dist > radius_km:
                    continue

                # Filter by bounding box
                if bounds_north is not None and bounds_south is not None:
                    if not (bounds_south <= branch.latitude <= bounds_north):
                        continue
                if bounds_east is not None and bounds_west is not None:
                    if not (bounds_west <= branch.longitude <= bounds_east):
                        continue

                # Filter by search
                if search:
                    s_lower = search.lower()
                    if s_lower not in parent_cafe.name.lower() and s_lower not in branch.name.lower() and s_lower not in branch.address.lower():
                        continue

                # Filter by city
                if city:
                    if city.lower() not in branch.address.lower():
                        continue

                num_offers = offers_count_map.get(parent_cafe.id, 0)
                num_events = events_count_map.get(parent_cafe.id, 0)

                if has_offers is True and num_offers == 0:
                    continue
                if has_events is True and num_events == 0:
                    continue

                display_title = f"{parent_cafe.name} - {branch.name}"
                markers.append(
                    CafeMapMarker(
                        id=f"branch_{branch.id}",
                        marker_type="branch",
                        cafe_id=parent_cafe.id,
                        branch_id=branch.id,
                        name=parent_cafe.name,
                        branch_name=branch.name,
                        display_title=display_title,
                        description=parent_cafe.description,
                        address=branch.address,
                        latitude=branch.latitude,
                        longitude=branch.longitude,
                        place_id=branch.place_id,
                        logo_url=getattr(parent_cafe, "logo_url", None),
                        cover_image_url=getattr(parent_cafe, "cover_image_url", None),
                        phone=getattr(branch, "phone", None) or getattr(parent_cafe, "phone", None),
                        rating=4.8,
                        working_hours=branch.working_hours or parent_cafe.working_hours,
                        is_open_now=True,
                        distance_km=dist,
                        google_maps_url=f"https://www.google.com/maps/search/?api=1&query={branch.latitude},{branch.longitude}",
                        active_offers_count=num_offers,
                        active_events_count=num_events,
                    )
                )

        # Sort by distance if available, otherwise by name
        if latitude is not None and longitude is not None:
            markers.sort(key=lambda m: (m.distance_km if m.distance_km is not None else float("inf")))
        else:
            markers.sort(key=lambda m: m.display_title)

        return CafeMapResponse(
            total_markers=len(markers),
            user_latitude=latitude,
            user_longitude=longitude,
            markers=markers,
        )
