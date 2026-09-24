from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DiseaseCreate(BaseModel):
    name: str = Field(...)
    name_local: Optional[str] = None
    species_affected: list[str] = Field(default_factory=list)
    symptoms: list[str] = Field(default_factory=list)
    transmission_mode: Optional[str] = None
    incubation_period: Optional[str] = None
    severity: str = Field(default="medium", description="low, medium, high, critical")
    is_zoonotic: bool = False
    prevention_guidelines: Optional[str] = None
    treatment_protocol: Optional[str] = None
    image_urls: list[str] = Field(default_factory=list)


class DiseaseResponse(BaseModel):
    id: int
    name: str
    name_local: Optional[str] = None
    species_affected: list[str]
    symptoms: list[str]
    transmission_mode: Optional[str] = None
    incubation_period: Optional[str] = None
    severity: str
    is_zoonotic: bool
    prevention_guidelines: Optional[str] = None
    treatment_protocol: Optional[str] = None
    image_urls: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
