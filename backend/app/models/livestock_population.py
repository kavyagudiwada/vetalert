from sqlalchemy import Integer, String, BigInteger, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DistrictLivestockPopulation(Base):
    __tablename__ = "district_livestock_population"
    __table_args__ = (
        UniqueConstraint(
            "state", "district", "species", "census_year",
            name="uq_livestock_pop_state_district_species_year",
        ),
        Index("ix_livestock_pop_state_district", "state", "district"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    state: Mapped[str] = mapped_column(String(100), index=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    species: Mapped[str] = mapped_column(String(50))
    male: Mapped[int] = mapped_column(BigInteger, default=0)
    female: Mapped[int] = mapped_column(BigInteger, default=0)
    total: Mapped[int] = mapped_column(BigInteger, default=0)
    census_year: Mapped[int] = mapped_column(Integer, default=2019)
    source: Mapped[str] = mapped_column(String(200), default="20th Livestock Census (2019)")

    def __repr__(self) -> str:
        return f"<DistrictLivestockPopulation {self.state}/{self.district}/{self.species}: {self.total}>"