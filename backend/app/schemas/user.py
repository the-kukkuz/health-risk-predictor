from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True