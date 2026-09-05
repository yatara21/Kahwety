from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any


class CafeMapMarker(BaseModel):
    id: str = Field(..., description="Unique pin identifier (e.g. 'cafe_<uuid>' or 'branch_<uuid>')")
    marker_type: str = Field("cafe", description="'cafe' for main cafe location or 'branch' for a branch")
    cafe_id: str = Field(..., description="Cafe identifier")
    branch_id: Optional[str] = Field(None, description="Branch identifier if this marker represents a branch")
    name: str = Field(..., description="Cafe name (e.g. 'قهوة سيلانترو')")
    branch_name: Optional[str] = Field(None, description="Branch name (e.g. 'فرع العليا') or None for main location")
    display_title: str = Field(..., description="Formatted display title for map tooltip/card")
    description: Optional[str] = Field(None, description="Cafe description")
    address: str = Field(..., description="Physical street address")
    latitude: float = Field(..., description="GPS latitude coordinate for Google Maps marker")
    longitude: float = Field(..., description="GPS longitude coordinate for Google Maps marker")
    place_id: Optional[str] = Field(None, description="Google Maps Place ID if available")
    logo_url: Optional[str] = Field(None, description="Cafe logo image URL")
    cover_image_url: Optional[str] = Field(None, description="Cafe cover image URL")
    phone: Optional[str] = Field(None, description="Contact phone number")
    rating: float = Field(4.8, description="Average rating")
    working_hours: Optional[Dict[str, Any]] = Field(None, description="Working hours dictionary")
    is_open_now: bool = Field(True, description="Whether the location is currently open")
    distance_km: Optional[float] = Field(None, description="Distance from user in kilometers if user coordinates provided")
    google_maps_url: str = Field(..., description="Direct Google Maps URL for directions/navigation")
    active_offers_count: int = Field(0, description="Number of currently active offers")
    active_events_count: int = Field(0, description="Number of upcoming events")

    model_config = ConfigDict(from_attributes=True)


class CafeMapResponse(BaseModel):
    total_markers: int = Field(..., description="Total number of map pins returned")
    user_latitude: Optional[float] = Field(None, description="User GPS latitude if provided in request")
    user_longitude: Optional[float] = Field(None, description="User GPS longitude if provided in request")
    markers: List[CafeMapMarker] = Field(..., description="List of cafe and branch map markers")
