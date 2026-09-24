from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, Float, DateTime, Text, JSON, UniqueConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DiseaseSurveillance(Base):
    __tablename__ = "disease_surveillance"
    __table_args__ = (
        UniqueConstraint(
            "year", "state", "disease_name", "surveillance_type", "round_number",
            name="uq_surveillance_year_state_disease_type_round",
        ),
        Index("ix_surveillance_state_year", "state", "year"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    disease_name: Mapped[str] = mapped_column(String(255), index=True)
    state: Mapped[str] = mapped_column(String(100), index=True)
    surveillance_type: Mapped[str] = mapped_column(String(50), default="serosurveillance")
    round_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sample_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    positive_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    source: Mapped[str] = mapped_column(Text, default="NIVEDI NADRES - FMD serosurveillance/seromonitoring")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<DiseaseSurveillance {self.year} {self.state} {self.disease_name}: {self.positive_pct}%>"