from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Integer, String, DateTime, Enum, Text, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DiseaseSeverity(str, PyEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Disease(Base):
    __tablename__ = "diseases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name_local: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    species_affected: Mapped[list] = mapped_column(JSONB, default=list)
    symptoms: Mapped[list] = mapped_column(JSONB, default=list)
    transmission_mode: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    incubation_period: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    severity: Mapped[DiseaseSeverity] = mapped_column(
        Enum(DiseaseSeverity, name="disease_severity"), default=DiseaseSeverity.medium
    )
    is_zoonotic: Mapped[bool] = mapped_column(Boolean, default=False)
    prevention_guidelines: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    treatment_protocol: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_urls: Mapped[list] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<Disease {self.id} {self.name}>"
