from pydantic import ConfigDict, BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from app.modules.cafes.schemas import validate_coordinate_pair


class BranchBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str = Field(..., min_length=1, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    place_id: Optional[str] = Field(None, max_length=255)
    working_hours: Optional[dict] = None

    @model_validator(mode="after")
    def _validate_coordinates(self):
        validate_coordinate_pair(self.latitude, self.longitude)
        return self


class BranchCreate(BranchBase):
    cafe_id: str


class BranchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    place_id: Optional[str] = Field(None, max_length=255)
    working_hours: Optional[dict] = None

    @model_validator(mode="after")
    def _validate_coordinates(self):
        validate_coordinate_pair(self.latitude, self.longitude)
        return self


class BranchResponse(BranchBase):
    id: str
    cafe_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)