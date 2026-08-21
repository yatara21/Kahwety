from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, Any


T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict = Field(..., description="Error details")


class MessageResponse(BaseModel):
    """Small acknowledgement body for endpoints with no resource to return."""

    message: str
