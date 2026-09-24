from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.disease import Disease, DiseaseSeverity
from app.models.user import User
from app.schemas.disease import DiseaseCreate, DiseaseResponse

router = APIRouter()


@router.post("", response_model=DiseaseResponse, status_code=status.HTTP_201_CREATED)
async def create_disease(
    disease_data: DiseaseCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DiseaseResponse:
    existing = await db.execute(select(Disease).where(Disease.name == disease_data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Disease already exists")

    disease = Disease(
        name=disease_data.name,
        name_local=disease_data.name_local,
        species_affected=disease_data.species_affected,
        symptoms=disease_data.symptoms,
        transmission_mode=disease_data.transmission_mode,
        incubation_period=disease_data.incubation_period,
        severity=DiseaseSeverity(disease_data.severity),
        is_zoonotic=disease_data.is_zoonotic,
        prevention_guidelines=disease_data.prevention_guidelines,
        treatment_protocol=disease_data.treatment_protocol,
        image_urls=disease_data.image_urls,
    )
    db.add(disease)
    await db.commit()
    await db.refresh(disease)
    return DiseaseResponse.model_validate(disease)


@router.get("", response_model=list[DiseaseResponse])
async def list_diseases(
    search: str | None = None,
    severity: str | None = None,
    species: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[DiseaseResponse]:
    query = select(Disease).order_by(Disease.name)

    if search:
        like = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Disease.name).like(like),
                func.lower(Disease.name_local or "").like(like),
            )
        )
    if severity:
        query = query.where(Disease.severity == severity)
    if species:
        query = query.where(Disease.species_affected.contains([species]))

    result = await db.execute(query)
    diseases = list(result.scalars().all())
    return [DiseaseResponse.model_validate(d) for d in diseases]


@router.get("/search-by-symptoms", response_model=list[DiseaseResponse])
async def search_by_symptoms(
    symptoms: str = Query(..., description="Comma-separated symptom codes"),
    species: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[DiseaseResponse]:
    symptom_list = [s.strip().lower() for s in symptoms.split(",") if s.strip()]
    if not symptom_list:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No symptoms provided")

    query = select(Disease)
    if species:
        query = query.where(Disease.species_affected.contains([species]))

    result = await db.execute(query)
    all_diseases = list(result.scalars().all())

    scored = []
    for d in all_diseases:
        disease_symptoms = [s.lower() for s in (d.symptoms or [])]
        matches = [s for s in symptom_list if s in disease_symptoms]
        if matches:
            scored.append((len(matches), DiseaseResponse.model_validate(d)))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in scored[:10]]


@router.get("/{disease_id}", response_model=DiseaseResponse)
async def get_disease(
    disease_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DiseaseResponse:
    result = await db.execute(select(Disease).where(Disease.id == disease_id))
    disease = result.scalar_one_or_none()
    if not disease:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disease not found")
    return DiseaseResponse.model_validate(disease)
