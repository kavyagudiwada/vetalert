from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LabSampleCreate(BaseModel):
    sample_id: str = Field(...)
    animal_id: Optional[int] = None
    symptom_report_id: Optional[int] = None
    sample_type: str = Field(..., description="blood, tissue, swab, milk, feces, urine")
    collected_by: int
    collection_date: datetime
    lab_id: Optional[str] = None


class LabSampleResponse(BaseModel):
    id: int
    sample_id: str
    animal_id: Optional[int] = None
    symptom_report_id: Optional[int] = None
    sample_type: str
    collected_by: int
    collection_date: datetime
    lab_id: Optional[str] = None
    status: str
    result: Optional[str] = None
    result_details: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
