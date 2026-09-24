from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class OutbreakStatus(str, PyEnum):
    suspected = "suspected"
    confirmed = "confirmed"
    contained = "contained"
    resolved = "resolved"


class Outbreak(Base):
    __tablename__ = "outbreaks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    disease_id: Mapped[int] = mapped_column(ForeignKey("diseases.id"), index=True)
    confirmed_by: Mapped[Optional[int]] = mapped_column(ForeignKey("veterinarians.id"), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    block: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    affected_villages: Mapped[list] = mapped_column(JSONB, default=list)
    affected_animal_count: Mapped[int] = mapped_column(Integer, default=0)
    confirmed_cases: Mapped[int] = mapped_column(Integer, default=0)
    deaths: Mapped[int] = mapped_column(Integer, default=0)
    location: Mapped[Optional[object]] = mapped_column(Geometry("POINT", srid=4326), nullable=True)
    status: Mapped[OutbreakStatus] = mapped_column(
        Enum(OutbreakStatus, name="outbreak_status"), default=OutbreakStatus.suspected, index=True
    )
    risk_level: Mapped[str] = mapped_column(String(20), default="medium", index=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    disease: Mapped["Disease"] = relationship("Disease")

    def __repr__(self) -> str:
        return f"<Outbreak {self.id} disease={self.disease_id} {self.status}>"
