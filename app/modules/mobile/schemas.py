from pydantic import BaseModel, Field


class MobileComplaintCreate(BaseModel):
    cafe_id: str
    subject: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=2000)
