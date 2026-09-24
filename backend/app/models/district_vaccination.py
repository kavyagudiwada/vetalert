from sqlalchemy import Integer, String, BigInteger, UniqueConstraint, Index, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DistrictVaccination(Base):
    __tablename__ = "district_vaccinations"
    __table_args__ = (
        UniqueConstraint(
            "state", "district", "vaccination_round", "vaccine_name",
            name="uq_district_vaccination_state_district_round_vaccine",
        ),
        Index("ix_district_vaccination_state_district", "state", "district"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    state: Mapped[str] = mapped_column(String(100), index=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    vaccination_round: Mapped[int] = mapped_column(Integer, default=1)
    vaccine_name: Mapped[str] = mapped_column(String(100), default="FMD")
    total_vaccinations: Mapped[int] = mapped_column(BigInteger, default=0)
    farmers_benefited: Mapped[int] = mapped_column(BigInteger, default=0)
    source: Mapped[str] = mapped_column(Text, default="FMD National Foot & Mouth Disease Control Programme (NADCP)")

    def __repr__(self) -> str:
        return f"<DistrictVaccination {self.state}/{self.district} R{self.vaccination_round}: {self.total_vaccinations}>"