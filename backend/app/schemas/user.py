from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=10, max_length=15)
    full_name: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)
    role: str = "farmer"
    language_preference: str = "en"


class UserLogin(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    password: str = Field(...)


class GoogleLoginRequest(BaseModel):
    credential: str = Field(..., description="Google ID token JWT")
    role: str = Field("farmer", description="Role to use for a newly created account")


class UserResponse(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    phone: str
    full_name: str
    role: str
    language_preference: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
