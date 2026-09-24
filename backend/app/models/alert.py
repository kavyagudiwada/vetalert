from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum, Text, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AlertType(str, PyEnum):
    outbreak = "outbreak"
    vaccination_reminder = "vaccination_reminder"
    weather_advisory = "weather_advisory"
    disease_prevention = "disease_prevention"
    emergency = "emergency"


class AlertSeverity(str, PyEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    alert_type: Mapped[AlertType] = mapped_column(Enum(AlertType, name="alert_type"), index=True)
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, name="alert_severity"), default=AlertSeverity.medium
    )
    district: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    block: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    village: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    target_audience: Mapped[list] = mapped_column(JSONB, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<Alert {self.id} {self.title} {self.severity}>"
