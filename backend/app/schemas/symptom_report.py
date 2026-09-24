from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: list[float] = Field(..., description="[longitude, latitude]")


class SymptomReportCreate(BaseModel):
    animal_id: Optional[int] = None
    animal_species: str = Field(...)
    symptoms: list[str] = Field(..., min_length=1)
    description: Optional[str] = None
    severity: str = Field(default="medium", description="low, medium, high, critical")
    location: Optional[GeoPoint] = None
    village: Optional[str] = None
    district: Optional[str] = None
    images: list[str] = Field(default_factory=list)


class SymptomReportResponse(BaseModel):
    id: int
    reporter_id: int
    animal_id: Optional[int] = None
    animal_species: str
    symptoms: list[str]
    description: Optional[str] = None
    severity: str
    location: Optional[Any] = None
    village: Optional[str] = None
    district: Optional[str] = None
    images: list[str]
    status: str
    triage_result: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SymptomReportList(BaseModel):
    total: int
    items: list[SymptomReportResponse]
