from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    title: str = Field(...)
    message: str = Field(...)
    alert_type: str = Field(..., description="outbreak, vaccination_reminder, weather_advisory, disease_prevention, emergency")
    severity: str = Field(default="medium", description="low, medium, high, critical")
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    target_audience: list[str] = Field(default_factory=list)
    expires_at: Optional[datetime] = None


class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    alert_type: str
    severity: str
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    target_audience: list[str]
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
