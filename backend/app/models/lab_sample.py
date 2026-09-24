from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SampleType(str, PyEnum):
    blood = "blood"
    tissue = "tissue"
    swab = "swab"
    milk = "milk"
    feces = "feces"
    urine = "urine"


class SampleStatus(str, PyEnum):
    collected = "collected"
    in_transit = "in_transit"
    received = "received"
    testing = "testing"
    completed = "completed"
    contaminated = "contaminated"


class LabSample(Base):
    __tablename__ = "lab_samples"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sample_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    animal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("animals.id"), nullable=True, index=True)
    symptom_report_id: Mapped[Optional[int]] = mapped_column(ForeignKey("symptom_reports.id"), nullable=True)
    sample_type: Mapped[SampleType] = mapped_column(Enum(SampleType, name="sample_type"))
    collected_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    collection_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    lab_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[SampleStatus] = mapped_column(
        Enum(SampleStatus, name="sample_status"), default=SampleStatus.collected, index=True
    )
    result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    animal: Mapped[Optional["Animal"]] = relationship("Animal")
    symptom_report: Mapped[Optional["SymptomReport"]] = relationship("SymptomReport")

    def __repr__(self) -> str:
        return f"<LabSample {self.id} {self.sample_id} {self.status}>"
