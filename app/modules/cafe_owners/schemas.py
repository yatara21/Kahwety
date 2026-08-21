from pydantic import ConfigDict, BaseModel, Field
from typing import Optional
from datetime import datetime


class CafeOwnerResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
class CafeOwnerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = None
