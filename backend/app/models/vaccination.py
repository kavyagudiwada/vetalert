from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VaccinationStatus(str, PyEnum):
    completed = "completed"
    scheduled = "scheduled"
    missed = "missed"
    reaction_reported = "reaction_reported"


class Vaccination(Base):
    __tablename__ = "vaccinations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animals.id"), index=True)
    vaccine_name: Mapped[str] = mapped_column(String(255))
    disease_name: Mapped[str] = mapped_column(String(255))
    batch_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    administered_by: Mapped[Optional[int]] = mapped_column(ForeignKey("veterinarians.id"), nullable=True)
    date_administered: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    next_due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    dose_number: Mapped[int] = mapped_column(Integer, default=1)
    reaction_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[VaccinationStatus] = mapped_column(
        Enum(VaccinationStatus, name="vaccination_status"), default=VaccinationStatus.scheduled, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    animal: Mapped["Animal"] = relationship("Animal")

    def __repr__(self) -> str:
        return f"<Vaccination {self.id} {self.vaccine_name} {self.status}>"
