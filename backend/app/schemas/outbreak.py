from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import wkb_to_geojson


class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: list[float] = Field(..., description="[longitude, latitude]")


class OutbreakCreate(BaseModel):
    disease_id: int
    district: Optional[str] = None
    block: Optional[str] = None
    affected_villages: list[str] = Field(default_factory=list)
    affected_animal_count: int = 0
    confirmed_cases: int = 0
    deaths: int = 0
    location: Optional[GeoPoint] = None
    risk_level: str = Field(default="medium", description="low, medium, high, critical")
    start_date: Optional[datetime] = None
    notes: Optional[str] = None


class OutbreakResponse(BaseModel):
    id: int
    disease_id: int
    confirmed_by: Optional[int] = None
    district: Optional[str] = None
    block: Optional[str] = None
    affected_villages: list[str]
    affected_animal_count: int
    confirmed_cases: int
    deaths: int
    location: Optional[Any] = None
    status: str
    risk_level: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_validator("location", mode="before")
    @classmethod
    def convert_location(cls, v):
        return wkb_to_geojson(v)
