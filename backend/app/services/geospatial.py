import logging
from typing import Any, Optional

from geoalchemy2 import WKTElement
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.models.symptom_report import SymptomReport
from app.models.alert import Alert
from app.models.outbreak import Outbreak

logger = logging.getLogger(__name__)


def geopoint_to_wkt(location: Any) -> Optional[WKTElement]:
    if location is None:
        return None
    if isinstance(location, WKTElement):
        return location
    if hasattr(location, "coordinates"):
        coords = getattr(location, "coordinates")
    elif isinstance(location, dict):
        coords = (location or {}).get("coordinates")
    else:
        return None
    if not coords or len(coords) < 2:
        return None
    return WKTElement(f"POINT({coords[0]} {coords[1]})", srid=4326)


async def find_nearby_reports(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    status: Optional[str] = None,
    limit: int = 50,
) -> list[SymptomReport]:
    query = select(SymptomReport).where(
        func.ST_DWithin(
            SymptomReport.location,
            func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326),
            radius_km * 1000,
        )
    )

    if status:
        query = query.where(SymptomReport.status == status)

    query = query.order_by(SymptomReport.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def calculate_disease_risk_zone(
    db: AsyncSession,
    district: Optional[str] = None,
    radius_km: float = 20.0,
) -> dict[str, Any]:
    risk_zones = {"high": 0, "medium": 0, "low": 0, "critical": 0}
    active_outbreaks = []

    query = select(Outbreak).where(Outbreak.status.in_(["suspected", "confirmed"]))
    if district:
        query = query.where(Outbreak.district == district)

    result = await db.execute(query)
    outbreaks = result.scalars().all()

    for outbreak in outbreaks:
        risk_zones[outbreak.risk_level] = risk_zones.get(outbreak.risk_level, 0) + 1
        if outbreak.risk_level in ("high", "critical"):
            active_outbreaks.append({
                "id": outbreak.id,
                "disease_id": outbreak.disease_id,
                "district": outbreak.district,
                "block": outbreak.block,
                "risk_level": outbreak.risk_level,
                "affected_animal_count": outbreak.affected_animal_count,
                "deaths": outbreak.deaths,
                "affected_villages": outbreak.affected_villages,
            })

    return {
        "risk_zones": risk_zones,
        "active_outbreaks": active_outbreaks,
        "total_active_outbreaks": len(outbreaks),
    }


async def get_animal_density(
    db: AsyncSession,
    district: Optional[str] = None,
    species: Optional[str] = None,
) -> dict[str, Any]:
    conditions = []
    if district:
        conditions.append(f"district = '{district}'")

    conditions_sql = " AND ".join(conditions) if conditions else "TRUE"

    if species:
        query = text(
            f"SELECT species, COUNT(*) as count FROM animals "
            f"WHERE {conditions_sql} AND species = '{species}' AND is_active = TRUE "
            f"GROUP BY species"
        )
    else:
        query = text(
            f"SELECT species, COUNT(*) as count FROM animals "
            f"WHERE {conditions_sql} AND is_active = TRUE "
            f"GROUP BY species"
        )

    result = await db.execute(query)
    rows = result.fetchall()

    density = {}
    total = 0
    for row in rows:
        density[row[0]] = row[1]
        total += row[1]

    return {
        "by_species": density,
        "total": total,
        "district": district,
    }


async def get_point_in_polygon(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    table: str = "villages",
) -> Optional[dict]:
    allowed_tables = {"villages", "districts", "blocks"}
    if table not in allowed_tables:
        raise ValueError(f"Table must be one of {allowed_tables}")

    query = text(
        f"SELECT name, gid, ST_AsGeoJSON(geom) as geojson "
        f"FROM {table} "
        f"WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) "
        f"LIMIT 1"
    )
    result = await db.execute(query, {"lng": longitude, "lat": latitude})
    row = result.fetchone()

    if row:
        return {"name": row[0], "gid": row[1], "geometry": row[2]}
    return None
