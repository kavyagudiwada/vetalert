from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import wkb_to_geojson


class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: list[float] = Field(..., description="[longitude, latitude]")


class AnimalCreate(BaseModel):
    tag_number: str = Field(..., min_length=1)
    name: Optional[str] = None
    species: str = Field(..., description="cattle, buffalo, sheep, goat, pig, poultry, equine, other")
    breed: Optional[str] = None
    gender: Optional[str] = Field(None, description="male or female")
    date_of_birth: Optional[datetime] = None
    color: Optional[str] = None
    owner_id: Optional[int] = None
    location: Optional[GeoPoint] = None

    @field_validator("location", mode="before")
    @classmethod
    def normalize_location(cls, v):
        if v is None:
            return v
        if isinstance(v, dict) and "longitude" in v and "latitude" in v:
            return GeoPoint(coordinates=[v["longitude"], v["latitude"]])
        return v


class AnimalResponse(BaseModel):
    id: int
    tag_number: str
    name: Optional[str] = None
    species: str
    breed: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    color: Optional[str] = None
    owner_id: int
    location: Optional[Any] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_validator("location", mode="before")
    @classmethod
    def convert_location(cls, v):
        return wkb_to_geojson(v)


class AnimalList(BaseModel):
    total: int
    items: list[AnimalResponse]
