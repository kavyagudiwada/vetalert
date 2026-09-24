from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.animal import Animal
from app.models.symptom_report import SymptomReport
from app.models.outbreak import Outbreak
from app.models.vaccination import Vaccination
from app.models.alert import Alert
from app.models.disease import Disease
from app.models.user import User, UserRole
from app.models.livestock_population import DistrictLivestockPopulation
from app.models.district_vaccination import DistrictVaccination
from app.models.disease_surveillance import DiseaseSurveillance
from app.services.geospatial import calculate_disease_risk_zone, get_animal_density

router = APIRouter()

DASHBOARD_ACCESS = require_role(UserRole.govt_officer, UserRole.veterinarian, UserRole.admin)


@router.get("/stats", response_model=dict)
async def get_dashboard_stats(
    district: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> dict:
    animal_count = (await db.execute(select(func.count(Animal.id)))).scalar() or 0
    report_count = (await db.execute(select(func.count(SymptomReport.id)))).scalar() or 0
    open_reports = (
        await db.execute(
            select(func.count(SymptomReport.id)).where(
                SymptomReport.status.in_(["reported", "triaged", "confirmed"])
            )
        )
    ).scalar() or 0
    active_outbreak_count = (
        await db.execute(
            select(func.count(Outbreak.id)).where(Outbreak.status.in_(["suspected", "confirmed"]))
        )
    ).scalar() or 0
    completed_vaccination_count = (
        await db.execute(
            select(func.count(Vaccination.id)).where(Vaccination.status == "completed")
        )
    ).scalar() or 0
    total_vaccination_count = (await db.execute(select(func.count(Vaccination.id)))).scalar() or 0
    active_alert_count = (
        await db.execute(select(func.count(Alert.id)).where(Alert.is_active.is_(True)))
    ).scalar() or 0

    vaccination_coverage = round((completed_vaccination_count / total_vaccination_count * 100), 1) if total_vaccination_count else 0

    species_result = await db.execute(
        select(Animal.species, func.count(Animal.id)).group_by(Animal.species)
    )
    species_distribution = {str(row[0]): row[1] for row in species_result.all()}

    disease_result = await db.execute(select(Disease.name, func.count(Outbreak.id))
                                      .join(Outbreak, Outbreak.disease_id == Disease.id)
                                      .group_by(Disease.name))
    disease_outbreaks = {str(row[0]): row[1] for row in disease_result.all()}

    livestock_total = (
        await db.execute(
            select(func.coalesce(func.sum(DistrictLivestockPopulation.total), 0))
            .where(DistrictLivestockPopulation.census_year == 2019)
        )
    ).scalar() or 0

    fmd_doses = (
        await db.execute(
            select(func.coalesce(func.sum(DistrictVaccination.total_vaccinations), 0))
        )
    ).scalar() or 0
    fmd_farmers = (
        await db.execute(
            select(func.coalesce(func.sum(DistrictVaccination.farmers_benefited), 0))
        )
    ).scalar() or 0
    fmd_districts = (
        await db.execute(
            select(func.count(func.distinct(DistrictVaccination.district))).where(
                DistrictVaccination.vaccination_round == 6
            )
        )
    ).scalar() or 0
    surveillance_records = (
        await db.execute(select(func.count(DiseaseSurveillance.id)))
    ).scalar() or 0

    return {
        "total_animals": animal_count,
        "livestock_population": livestock_total,
        "total_reports": report_count,
        "open_reports": open_reports,
        "active_outbreaks": active_outbreak_count,
        "vaccination_coverage": vaccination_coverage,
        "total_vaccinations": total_vaccination_count,
        "active_alerts": active_alert_count,
        "species_distribution": species_distribution,
        "disease_outbreaks": disease_outbreaks,
        "fmd_vaccination_doses": fmd_doses,
        "fmd_farmers_benefited": fmd_farmers,
        "fmd_districts_covered": fmd_districts,
        "surveillance_records": surveillance_records,
    }


@router.get("/disease-heatmap", response_model=dict)
async def get_disease_heatmap(
    district: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> dict:
    risk = await calculate_disease_risk_zone(db, district=district)

    report_result = await db.execute(
        select(SymptomReport.district, func.count(SymptomReport.id))
        .group_by(SymptomReport.district)
    )
    reports_by_district = {str(row[0]): row[1] for row in report_result.all()}

    return {
        "risk_zones": risk["risk_zones"],
        "active_outbreaks": risk["active_outbreaks"],
        "reports_by_district": reports_by_district,
    }


@router.get("/livestock-population", response_model=list[dict])
async def get_livestock_population(
    state: str | None = None,
    district: str | None = None,
    species: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> list[dict]:
    stmt = select(DistrictLivestockPopulation).where(
        DistrictLivestockPopulation.census_year == 2019
    )
    if state:
        stmt = stmt.where(DistrictLivestockPopulation.state == state)
    if district:
        stmt = stmt.where(DistrictLivestockPopulation.district == district)
    if species:
        stmt = stmt.where(DistrictLivestockPopulation.species == species)
    stmt = stmt.order_by(
        DistrictLivestockPopulation.state,
        DistrictLivestockPopulation.district,
        DistrictLivestockPopulation.species,
    )
    result = await db.execute(stmt)
    return [
        {
            "state": r.state,
            "district": r.district,
            "species": r.species,
            "male": r.male,
            "female": r.female,
            "total": r.total,
            "census_year": r.census_year,
            "source": r.source,
        }
        for r in result.scalars().all()
    ]


@router.get("/district-summary", response_model=list[dict])
async def get_district_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> list[dict]:
    report_result = await db.execute(
        select(
            SymptomReport.district,
            func.count(SymptomReport.id),
        ).group_by(SymptomReport.district)
    )
    report_map = {str(r[0]): r[1] for r in report_result.all() if r[0]}

    outbreak_result = await db.execute(
        select(Outbreak.district, func.count(Outbreak.id))
        .where(Outbreak.status.in_(["suspected", "confirmed"]))
        .group_by(Outbreak.district)
    )
    outbreak_map = {str(r[0]): r[1] for r in outbreak_result.all() if r[0]}

    vaccination_result = await db.execute(
        select(func.count(Vaccination.id)).where(Vaccination.status == "completed")
    )
    total_completed = vaccination_result.scalar() or 0

    census_result = await db.execute(
        select(DistrictLivestockPopulation).where(
            DistrictLivestockPopulation.census_year == 2019
        )
    )
    census_map: dict[str, dict] = {}
    for row in census_result.scalars().all():
        entry = census_map.setdefault(
            (row.state, row.district), {"total": 0, "species": {}}
        )
        entry["total"] += row.total
        entry["species"][row.species] = row.total

    districts = set(report_map.keys()) | set(outbreak_map.keys())
    summary = []
    for district in districts:
        matched = next(
            (entry for (state, name), entry in census_map.items() if name == district),
            None,
        )
        summary.append({
            "district": district,
            "state": next(
                (state for (state, name) in census_map if name == district), None
            ),
            "total_reports": report_map.get(district, 0),
            "active_outbreaks": outbreak_map.get(district, 0),
            "total_livestock": matched["total"] if matched else 0,
            "livestock_by_species": matched["species"] if matched else None,
            "risk_level": (
                "high" if outbreak_map.get(district, 0) >= 1 else
                "medium" if report_map.get(district, 0) >= 5 else
                "low"
            ),
        })

    summary.sort(key=lambda x: x["active_outbreaks"], reverse=True)
    return summary


@router.get("/vaccination-coverage", response_model=list[dict])
async def get_vaccination_coverage(
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> list[dict]:
    result = await db.execute(
        select(
            DistrictVaccination.state,
            DistrictVaccination.district,
            func.sum(DistrictVaccination.total_vaccinations).label("total_doses"),
            func.sum(DistrictVaccination.farmers_benefited).label("farmers"),
            func.max(DistrictVaccination.vaccination_round).label("last_round"),
        )
        .group_by(DistrictVaccination.state, DistrictVaccination.district)
    )
    rows = result.all()

    livestock_result = await db.execute(
        select(
            DistrictLivestockPopulation.district,
            func.sum(DistrictLivestockPopulation.total),
        )
        .where(DistrictLivestockPopulation.census_year == 2019)
        .group_by(DistrictLivestockPopulation.district)
    )
    livestock_map = {str(r[0]): r[1] for r in livestock_result.all() if r[0]}

    coverage = []
    for state_name, district, total_doses, farmers, last_round in rows:
        population = livestock_map.get(district) or 0
        coverage.append({
            "state": state_name,
            "district": district,
            "total_doses": int(total_doses or 0),
            "farmers_benefited": int(farmers or 0),
            "last_round": int(last_round or 0),
            "livestock_population": int(population),
            "dose_to_livestock_ratio": round(total_doses / population, 3) if population else 0,
        })
    coverage.sort(key=lambda x: x["total_doses"], reverse=True)
    if state:
        coverage = [c for c in coverage if c["state"] == state]
    return coverage


@router.get("/surveillance", response_model=list[dict])
async def get_disease_surveillance(
    state: str | None = None,
    year: int | None = None,
    disease: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> list[dict]:
    stmt = select(DiseaseSurveillance)
    if state:
        stmt = stmt.where(DiseaseSurveillance.state == state)
    if year:
        stmt = stmt.where(DiseaseSurveillance.year == year)
    if disease:
        stmt = stmt.where(DiseaseSurveillance.disease_name.ilike(f"%{disease}%"))
    stmt = stmt.order_by(
        DiseaseSurveillance.year.desc(),
        DiseaseSurveillance.state,
        DiseaseSurveillance.surveillance_type,
    )
    result = await db.execute(stmt)
    return [
        {
            "id": r.id,
            "year": r.year,
            "disease_name": r.disease_name,
            "state": r.state,
            "surveillance_type": r.surveillance_type,
            "round_number": r.round_number,
            "sample_size": r.sample_size,
            "positive_pct": r.positive_pct,
            "details": r.details,
            "source": r.source,
        }
        for r in result.scalars().all()
    ]


@router.get("/recent-alerts", response_model=list[dict])
async def get_recent_alerts(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> list[dict]:
    result = await db.execute(
        select(Alert).where(Alert.is_active.is_(True)).order_by(Alert.created_at.desc()).limit(limit)
    )
    alerts = result.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "message": a.message,
            "severity": a.severity.value if hasattr(a.severity, "value") else a.severity,
            "alert_type": a.alert_type.value if hasattr(a.alert_type, "value") else a.alert_type,
            "district": a.district,
            "created_at": a.created_at,
        }
        for a in alerts
    ]


@router.get("/disease-trends", response_model=dict)
async def get_disease_trends(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(DASHBOARD_ACCESS),
) -> dict:
    result = await db.execute(
        select(
            func.date_trunc("day", Outbreak.created_at).label("day"),
            Disease.name,
            func.count(Outbreak.id),
        )
        .join(Disease, Outbreak.disease_id == Disease.id)
        .group_by("day", Disease.name)
        .order_by("day")
    )
    rows = result.all()
    series = {}
    for day, disease_name, count in rows:
        key = disease_name
        series.setdefault(key, []).append({
            "date": day.isoformat() if hasattr(day, "isoformat") else str(day),
            "count": count,
        })
    return {"series": series}
