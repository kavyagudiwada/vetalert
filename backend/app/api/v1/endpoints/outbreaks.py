from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.outbreak import Outbreak, OutbreakStatus
from app.models.disease import Disease
from app.models.user import User, UserRole
from app.schemas.outbreak import OutbreakCreate, OutbreakResponse
from app.services.geospatial import calculate_disease_risk_zone, geopoint_to_wkt

router = APIRouter()

OUTBREAK_VIEW = require_role(
    UserRole.veterinarian, UserRole.govt_officer, UserRole.admin
)
OUTBREAK_EDIT = require_role(UserRole.govt_officer, UserRole.veterinarian, UserRole.admin)


@router.post("", response_model=OutbreakResponse, status_code=status.HTTP_201_CREATED)
async def create_outbreak(
    outbreak_data: OutbreakCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(OUTBREAK_EDIT),
) -> OutbreakResponse:
    disease_result = await db.execute(
        select(Disease).where(Disease.id == outbreak_data.disease_id)
    )
    if not disease_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disease not found")

    outbreak = Outbreak(
        disease_id=outbreak_data.disease_id,
        district=outbreak_data.district,
        block=outbreak_data.block,
        affected_villages=outbreak_data.affected_villages,
        affected_animal_count=outbreak_data.affected_animal_count,
        confirmed_cases=outbreak_data.confirmed_cases,
        deaths=outbreak_data.deaths,
        location=geopoint_to_wkt(outbreak_data.location),
        risk_level=outbreak_data.risk_level,
        start_date=outbreak_data.start_date or datetime.utcnow(),
        notes=outbreak_data.notes,
        status=OutbreakStatus.suspected,
    )
    db.add(outbreak)
    await db.commit()
    await db.refresh(outbreak)
    return OutbreakResponse.model_validate(outbreak)


@router.get("", response_model=list[OutbreakResponse])
async def list_outbreaks(
    status_filter: str | None = Query(None, alias="status"),
    district: str | None = None,
    disease_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(OUTBREAK_VIEW),
) -> list[OutbreakResponse]:
    query = select(Outbreak).order_by(Outbreak.created_at.desc())
    if status_filter:
        query = query.where(Outbreak.status == status_filter)
    if district:
        query = query.where(Outbreak.district == district)
    if disease_id:
        query = query.where(Outbreak.disease_id == disease_id)

    result = await db.execute(query)
    outbreaks = list(result.scalars().all())
    return [OutbreakResponse.model_validate(o) for o in outbreaks]


@router.get("/stats", response_model=dict)
async def get_outbreak_stats(
    district: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(OUTBREAK_VIEW),
) -> dict:
    risk = await calculate_disease_risk_zone(db, district=district)
    return {
        "total_active": risk["total_active_outbreaks"],
        "risk_zones": risk["risk_zones"],
        "high_priority_outbreaks": len(risk["active_outbreaks"]),
    }


@router.get("/{outbreak_id}", response_model=OutbreakResponse)
async def get_outbreak(
    outbreak_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(OUTBREAK_VIEW),
) -> OutbreakResponse:
    result = await db.execute(select(Outbreak).where(Outbreak.id == outbreak_id))
    outbreak = result.scalar_one_or_none()
    if not outbreak:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outbreak not found")
    return OutbreakResponse.model_validate(outbreak)


@router.put("/{outbreak_id}/status", response_model=OutbreakResponse)
async def update_outbreak_status(
    outbreak_id: int,
    status_update: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(OUTBREAK_EDIT),
) -> OutbreakResponse:
    result = await db.execute(select(Outbreak).where(Outbreak.id == outbreak_id))
    outbreak = result.scalar_one_or_none()
    if not outbreak:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outbreak not found")

    new_status = status_update.get("status")
    if new_status not in [s.value for s in OutbreakStatus]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    outbreak.status = OutbreakStatus(new_status)

    for key in ("affected_animal_count", "confirmed_cases", "deaths", "risk_level", "notes"):
        if key in status_update:
            setattr(outbreak, key, status_update[key])

    if new_status == OutbreakStatus.resolved and not outbreak.end_date:
        outbreak.end_date = datetime.utcnow()

    await db.commit()
    await db.refresh(outbreak)
    return OutbreakResponse.model_validate(outbreak)
