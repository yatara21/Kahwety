from pydantic import ConfigDict, BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from app.common.enums import CafeRegistrationStatus


def validate_coordinate_pair(latitude: Optional[float], longitude: Optional[float]) -> None:
    """Raise ValueError when latitude/longitude are not provided together or out of range."""
    if (latitude is None) != (longitude is None):
        raise ValueError("latitude and longitude must be provided together")
    if latitude is not None and not (-90 <= latitude <= 90):
        raise ValueError("latitude must be between -90 and 90")
    if longitude is not None and not (-180 <= longitude <= 180):
        raise ValueError("longitude must be between -180 and 180")


class CafeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=1000)
    address: str = Field(..., min_length=1, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    place_id: Optional[str] = Field(None, max_length=255)
    working_hours: Optional[dict] = None

    @model_validator(mode="after")
    def _validate_coordinates(self):
        validate_coordinate_pair(self.latitude, self.longitude)
        return self


class CafeCreate(CafeBase):
    pass


class CafeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    place_id: Optional[str] = Field(None, max_length=255)
    working_hours: Optional[dict] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def _validate_coordinates(self):
        validate_coordinate_pair(self.latitude, self.longitude)
        return self


class CafeResponse(CafeBase):
    id: str
    owner_id: str
    approved_by: Optional[str] = None
    registration_status: CafeRegistrationStatus
    registration_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
class CafeApprovalRequest(BaseModel):
    status: CafeRegistrationStatus