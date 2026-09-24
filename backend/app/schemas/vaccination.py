from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VaccinationCreate(BaseModel):
    animal_id: int
    vaccine_name: str = Field(...)
    disease_name: str = Field(...)
    batch_number: Optional[str] = None
    administered_by: Optional[int] = None
    date_administered: datetime
    next_due_date: Optional[datetime] = None
    dose_number: int = 1
    reaction_notes: Optional[str] = None
    status: str = Field(default="scheduled", description="completed, scheduled, missed, reaction_reported")


class VaccinationResponse(BaseModel):
    id: int
    animal_id: int
    vaccine_name: str
    disease_name: str
    batch_number: Optional[str] = None
    administered_by: Optional[int] = None
    date_administered: datetime
    next_due_date: Optional[datetime] = None
    dose_number: int
    reaction_notes: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
