from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class AnimalSpecies(str, PyEnum):
    cattle = "cattle"
    buffalo = "buffalo"
    sheep = "sheep"
    goat = "goat"
    pig = "pig"
    poultry = "poultry"
    equine = "equine"
    other = "other"


class AnimalGender(str, PyEnum):
    male = "male"
    female = "female"


class Animal(Base):
    __tablename__ = "animals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tag_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    species: Mapped[AnimalSpecies] = mapped_column(Enum(AnimalSpecies, name="animal_species"), index=True)
    breed: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gender: Mapped[Optional[AnimalGender]] = mapped_column(Enum(AnimalGender, name="animal_gender"), nullable=True)
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), index=True)
    location: Mapped[Optional[object]] = mapped_column(Geometry("POINT", srid=4326), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner: Mapped["Farmer"] = relationship("Farmer", back_populates="animals")

    def __repr__(self) -> str:
        return f"<Animal {self.id} {self.tag_number} {self.species}>"
