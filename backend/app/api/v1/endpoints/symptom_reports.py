from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.symptom_report import SymptomReport, ReportStatus
from app.models.user import User, UserRole
from app.schemas.common import wkb_to_geojson
from app.schemas.symptom_report import SymptomReportCreate, SymptomReportResponse, SymptomReportList
from app.services.triage import triage_report
from app.services.geospatial import find_nearby_reports, geopoint_to_wkt

router = APIRouter()


def _to_response(report: SymptomReport) -> SymptomReportResponse:
    return SymptomReportResponse(
        id=report.id,
        reporter_id=report.reporter_id,
        animal_id=report.animal_id,
        animal_species=report.animal_species,
        symptoms=report.symptoms,
        description=report.description,
        severity=report.severity,
        location=wkb_to_geojson(report.location),
        village=report.village,
        district=report.district,
        images=report.images,
        status=report.status.value if hasattr(report.status, "value") else report.status,
        triage_result=report.triage_result,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.post("", response_model=SymptomReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: SymptomReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SymptomReportResponse:
    weather = None

    triage = triage_report(
        symptoms=report_data.symptoms,
        species=report_data.animal_species,
        location=report_data.location.model_dump() if report_data.location else None,
        weather=weather,
    )

    report = SymptomReport(
        reporter_id=current_user.id,
        animal_id=report_data.animal_id,
        animal_species=report_data.animal_species,
        symptoms=report_data.symptoms,
        description=report_data.description,
        severity=triage["report_severity"],
        location=geopoint_to_wkt(report_data.location),
        village=report_data.village,
        district=report_data.district,
        images=report_data.images,
        status=ReportStatus.triaged,
        triage_result=triage,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return _to_response(report)


@router.get("", response_model=SymptomReportList)
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: str | None = Query(None, alias="status"),
    district: str | None = None,
    species: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SymptomReportList:
    query = select(SymptomReport).order_by(SymptomReport.created_at.desc())
    base_filter = (
        SymptomReport.reporter_id == current_user.id
        if current_user.role == UserRole.farmer
        else None
    )
    if base_filter is not None:
        query = query.where(base_filter)
    if status_filter:
        query = query.where(SymptomReport.status == status_filter)
    if district:
        query = query.where(SymptomReport.district == district)
    if species:
        query = query.where(SymptomReport.animal_species == species)

    total_result = await db.execute(
        select(func.count(SymptomReport.id)).where(base_filter) if base_filter is not None
        else select(func.count(SymptomReport.id))
    )
    total = total_result.scalar() or 0

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    reports = list(result.scalars().all())

    return SymptomReportList(total=total, items=[_to_response(r) for r in reports])


@router.get("/nearby", response_model=SymptomReportList)
async def get_nearby_reports(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(10.0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SymptomReportList:
    reports = await find_nearby_reports(db, latitude, longitude, radius_km)
    return SymptomReportList(total=len(reports), items=[_to_response(r) for r in reports])


@router.get("/{report_id}", response_model=SymptomReportResponse)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SymptomReportResponse:
    result = await db.execute(select(SymptomReport).where(SymptomReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if current_user.role == UserRole.farmer and report.reporter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your report")
    return _to_response(report)


@router.put("/{report_id}/status", response_model=SymptomReportResponse)
async def update_report_status(
    report_id: int,
    status_update: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.veterinarian, UserRole.govt_officer, UserRole.admin)),
) -> SymptomReportResponse:
    result = await db.execute(select(SymptomReport).where(SymptomReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    new_status = status_update.get("status")
    if new_status not in [s.value for s in ReportStatus]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    report.status = ReportStatus(new_status)
    await db.commit()
    await db.refresh(report)
    return _to_response(report)


@router.delete("/{report_id}", response_model=dict)
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.veterinarian, UserRole.govt_officer, UserRole.admin)),
) -> dict:
    result = await db.execute(select(SymptomReport).where(SymptomReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    await db.delete(report)
    await db.commit()
    return {"message": "Report deleted"}
