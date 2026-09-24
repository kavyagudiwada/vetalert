from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class ReportStatus(str, PyEnum):
    reported = "reported"
    triaged = "triaged"
    confirmed = "confirmed"
    resolved = "resolved"
    false_alarm = "false_alarm"


class SymptomReport(Base):
    __tablename__ = "symptom_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    animal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("animals.id"), nullable=True, index=True)
    animal_species: Mapped[str] = mapped_column(String(50), index=True)
    symptoms: Mapped[list] = mapped_column(JSONB, default=list)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    location: Mapped[Optional[object]] = mapped_column(Geometry("POINT", srid=4326), nullable=True)
    village: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    images: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"), default=ReportStatus.reported, index=True
    )
    triage_result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reporter: Mapped["User"] = relationship("User")
    animal: Mapped[Optional["Animal"]] = relationship("Animal")

    def __repr__(self) -> str:
        return f"<SymptomReport {self.id} {self.animal_species} {self.status}>"
