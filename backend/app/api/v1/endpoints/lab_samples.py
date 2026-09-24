from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.lab_sample import LabSample, SampleStatus, SampleType
from app.models.user import User, UserRole
from app.schemas.lab_sample import LabSampleCreate, LabSampleResponse

router = APIRouter()

LAB_ACCESS = require_role(
    UserRole.veterinarian, UserRole.govt_officer, UserRole.lab_tech, UserRole.admin
)


@router.post("", response_model=LabSampleResponse, status_code=status.HTTP_201_CREATED)
async def create_sample(
    sample_data: LabSampleCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(LAB_ACCESS),
) -> LabSampleResponse:
    existing = await db.execute(select(LabSample).where(LabSample.sample_id == sample_data.sample_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sample ID already exists")

    sample = LabSample(
        sample_id=sample_data.sample_id,
        animal_id=sample_data.animal_id,
        symptom_report_id=sample_data.symptom_report_id,
        sample_type=SampleType(sample_data.sample_type),
        collected_by=sample_data.collected_by,
        collection_date=sample_data.collection_date,
        lab_id=sample_data.lab_id,
        status=SampleStatus.collected,
    )
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    return LabSampleResponse.model_validate(sample)


@router.get("", response_model=list[LabSampleResponse])
async def list_samples(
    status_filter: str | None = Query(None, alias="status"),
    sample_type: str | None = None,
    symptom_report_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(LAB_ACCESS),
) -> list[LabSampleResponse]:
    query = select(LabSample).order_by(LabSample.collection_date.desc())
    if status_filter:
        query = query.where(LabSample.status == status_filter)
    if sample_type:
        query = query.where(LabSample.sample_type == sample_type)
    if symptom_report_id:
        query = query.where(LabSample.symptom_report_id == symptom_report_id)

    result = await db.execute(query)
    samples = list(result.scalars().all())
    return [LabSampleResponse.model_validate(s) for s in samples]


@router.get("/{sample_id}", response_model=LabSampleResponse)
async def get_sample(
    sample_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(LAB_ACCESS),
) -> LabSampleResponse:
    result = await db.execute(select(LabSample).where(LabSample.id == sample_id))
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample not found")
    return LabSampleResponse.model_validate(sample)


@router.put("/{sample_id}/status", response_model=LabSampleResponse)
async def update_sample_status(
    sample_id: int,
    status_update: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(LAB_ACCESS),
) -> LabSampleResponse:
    result = await db.execute(select(LabSample).where(LabSample.id == sample_id))
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample not found")

    new_status = status_update.get("status")
    if new_status not in [s.value for s in SampleStatus]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    sample.status = SampleStatus(new_status)

    if "lab_id" in status_update:
        sample.lab_id = status_update["lab_id"]
    if "result" in status_update:
        sample.result = status_update["result"]
    if "result_details" in status_update:
        sample.result_details = status_update["result_details"]

    await db.commit()
    await db.refresh(sample)
    return LabSampleResponse.model_validate(sample)
