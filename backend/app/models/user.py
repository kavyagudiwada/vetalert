from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, Integer, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class UserRole(str, PyEnum):
    admin = "admin"
    farmer = "farmer"
    veterinarian = "veterinarian"
    para_vet = "para_vet"
    lab_tech = "lab_tech"
    govt_officer = "govt_officer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), default=UserRole.farmer)
    language_preference: Mapped[str] = mapped_column(String(10), default="en")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    farmer: Mapped[Optional["Farmer"]] = relationship("Farmer", back_populates="user", uselist=False)
    veterinarian: Mapped[Optional["Veterinarian"]] = relationship("Veterinarian", back_populates="user", uselist=False)

    def __repr__(self) -> str:
        return f"<User {self.id} {self.full_name} {self.role}>"
