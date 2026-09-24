from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.vaccination import Vaccination, VaccinationStatus
from app.models.district_vaccination import DistrictVaccination
from app.models.animal import Animal
from app.models.user import User, UserRole
from app.schemas.vaccination import VaccinationCreate, VaccinationResponse

router = APIRouter()

VET_OFFICIAL = require_role(UserRole.veterinarian, UserRole.govt_officer)


@router.post("", response_model=VaccinationResponse, status_code=status.HTTP_201_CREATED)
async def create_vaccination(
    vaccination_data: VaccinationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(VET_OFFICIAL),
) -> VaccinationResponse:
    animal_result = await db.execute(select(Animal).where(Animal.id == vaccination_data.animal_id))
    if not animal_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")

    vaccination = Vaccination(
        animal_id=vaccination_data.animal_id,
        vaccine_name=vaccination_data.vaccine_name,
        disease_name=vaccination_data.disease_name,
        batch_number=vaccination_data.batch_number,
        administered_by=vaccination_data.administered_by,
        date_administered=vaccination_data.date_administered,
        next_due_date=vaccination_data.next_due_date,
        dose_number=vaccination_data.dose_number,
        reaction_notes=vaccination_data.reaction_notes,
        status=VaccinationStatus(vaccination_data.status),
    )
    db.add(vaccination)
    await db.commit()
    await db.refresh(vaccination)
    return VaccinationResponse.model_validate(vaccination)


@router.get("", response_model=list[VaccinationResponse])
async def list_vaccinations(
    animal_id: int | None = None,
    status_filter: str | None = Query(None, alias="status"),
    disease_name: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(VET_OFFICIAL),
) -> list[VaccinationResponse]:
    query = select(Vaccination).order_by(Vaccination.date_administered.desc())
    if animal_id:
        query = query.where(Vaccination.animal_id == animal_id)
    if status_filter:
        query = query.where(Vaccination.status == status_filter)
    if disease_name:
        query = query.where(Vaccination.disease_name == disease_name)

    result = await db.execute(query)
    vaccinations = list(result.scalars().all())
    return [VaccinationResponse.model_validate(v) for v in vaccinations]


@router.get("/upcoming", response_model=list[VaccinationResponse])
async def get_upcoming_vaccinations(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(VET_OFFICIAL),
) -> list[VaccinationResponse]:
    today = datetime.now(timezone.utc)
    query = (
        select(Vaccination)
        .where(Vaccination.next_due_date.isnot(None))
        .where(Vaccination.next_due_date >= today)
        .order_by(Vaccination.next_due_date.asc())
        .limit(200)
    )
    result = await db.execute(query)
    vaccinations = list(result.scalars().all())
    return [
        VaccinationResponse.model_validate(v)
        for v in vaccinations
        if (v.next_due_date - today).days <= days
    ]


@router.get("/district-data", response_model=list[dict])
async def get_district_vaccination_data(
    state: str | None = None,
    district: str | None = None,
    round_number: int | None = Query(None, alias="round"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(VET_OFFICIAL),
) -> list[dict]:
    stmt = select(DistrictVaccination)
    if state:
        stmt = stmt.where(DistrictVaccination.state == state)
    if district:
        stmt = stmt.where(DistrictVaccination.district == district)
    if round_number:
        stmt = stmt.where(DistrictVaccination.vaccination_round == round_number)
    stmt = stmt.order_by(
        DistrictVaccination.state,
        DistrictVaccination.district,
        DistrictVaccination.vaccination_round,
    )
    result = await db.execute(stmt)
    return [
        {
            "state": r.state,
            "district": r.district,
            "vaccination_round": r.vaccination_round,
            "vaccine_name": r.vaccine_name,
            "total_vaccinations": r.total_vaccinations,
            "farmers_benefited": r.farmers_benefited,
            "source": r.source,
        }
        for r in result.scalars().all()
    ]


@router.get("/{vaccination_id}", response_model=VaccinationResponse)
async def get_vaccination(
    vaccination_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(VET_OFFICIAL),
) -> VaccinationResponse:
    result = await db.execute(select(Vaccination).where(Vaccination.id == vaccination_id))
    vaccination = result.scalar_one_or_none()
    if not vaccination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination not found")
    return VaccinationResponse.model_validate(vaccination)


@router.put("/{vaccination_id}/status", response_model=VaccinationResponse)
async def update_vaccination_status(
    vaccination_id: int,
    status_update: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(VET_OFFICIAL),
) -> VaccinationResponse:
    result = await db.execute(select(Vaccination).where(Vaccination.id == vaccination_id))
    vaccination = result.scalar_one_or_none()
    if not vaccination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination not found")

    new_status = status_update.get("status")
    if new_status not in [s.value for s in VaccinationStatus]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    vaccination.status = VaccinationStatus(new_status)
    if "reaction_notes" in status_update:
        vaccination.reaction_notes = status_update["reaction_notes"]

    await db.commit()
    await db.refresh(vaccination)
    return VaccinationResponse.model_validate(vaccination)
