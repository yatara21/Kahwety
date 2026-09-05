from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    url: str
    filename: str
    content_type: Optional[str] = None
    size: Optional[int] = None
