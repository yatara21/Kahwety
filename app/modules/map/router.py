from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.common.responses import SuccessResponse
from app.modules.map.schemas import CafeMapResponse
from app.modules.map.service import MapService


router = APIRouter(tags=["Google Maps - Cafes & Branches"])


@router.get("/map/cafes", response_model=SuccessResponse[CafeMapResponse], summary="Get registered cafes & branches for Google Maps")
@router.get("/cafes/map", response_model=SuccessResponse[CafeMapResponse], summary="Get registered cafes & branches for Google Maps (alias)")
async def get_cafes_for_map(
    latitude: Optional[float] = Query(None, ge=-90, le=90, description="User GPS latitude for distance calculation"),
    longitude: Optional[float] = Query(None, ge=-180, le=180, description="User GPS longitude for distance calculation"),
    radius_km: Optional[float] = Query(None, gt=0, le=500, description="Filter within radius in kilometers"),
    search: Optional[str] = Query(None, description="Search by cafe name, branch name, or address"),
    city: Optional[str] = Query(None, description="Filter by city name (e.g. Riyadh, Jeddah, Khobar)"),
    has_offers: Optional[bool] = Query(None, description="Filter only cafes with active offers"),
    has_events: Optional[bool] = Query(None, description="Filter only cafes with active events"),
    bounds_north: Optional[float] = Query(None, description="Viewport bounds north latitude"),
    bounds_south: Optional[float] = Query(None, description="Viewport bounds south latitude"),
    bounds_east: Optional[float] = Query(None, description="Viewport bounds east longitude"),
    bounds_west: Optional[float] = Query(None, description="Viewport bounds west longitude"),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Returns all approved and active cafes and their branches formatted as Google Maps markers.
    Includes GPS coordinates, full address, logo/cover image, working hours, active offers count,
    active events count, direct navigation URL, and calculated distance if user coordinates are provided.
    """
    service = MapService(session)
    result = await service.get_map_markers(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        search=search,
        city=city,
        has_offers=has_offers,
        has_events=has_events,
        bounds_north=bounds_north,
        bounds_south=bounds_south,
        bounds_east=bounds_east,
        bounds_west=bounds_west,
    )
    return SuccessResponse(data=result)


@router.get("/map/cafes/{cafe_id}", response_model=SuccessResponse[CafeMapResponse], summary="Get Google Maps pins for a specific cafe & branches")
async def get_cafe_branches_for_map(
    cafe_id: str,
    latitude: Optional[float] = Query(None, ge=-90, le=90, description="User GPS latitude"),
    longitude: Optional[float] = Query(None, ge=-180, le=180, description="User GPS longitude"),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Returns map markers for a specific cafe and all of its branches with GPS coordinates.
    """
    service = MapService(session)
    result = await service.get_map_markers(
        cafe_id=cafe_id,
        latitude=latitude,
        longitude=longitude,
    )
    return SuccessResponse(data=result)
