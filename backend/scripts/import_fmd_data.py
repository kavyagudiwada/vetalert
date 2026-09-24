"""Import real FMD programme data into Vetalert.

Two tables are populated:

1. district_vaccinations - National Foot and Mouth Disease Control
   Programme (NADCP) vaccination rounds 1-6, district-wise doses and
   farmers benefited. Source: artpark #0086 (DAHD/ICAR IVRI).
2. disease_surveillance - NIVEDI seromonitoring + serosurveillance of
   FMD (antibody prevalence % by state/year). Sources: artpark #0087
   (fmd_seromonitoring.csv) and #0089 (fmd_serosurveillance.csv).

Usage (from the backend/ directory):
    .venv\\Scripts\\python.exe scripts\\import_fmd_data.py
"""

import asyncio
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import delete

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import async_session_factory  # noqa: E402
from app.models.district_vaccination import DistrictVaccination  # noqa: E402
from app.models.disease_surveillance import DiseaseSurveillance  # noqa: E402

VACC_CSV = Path("C:/Users/kavya/AppData/Local/Temp/opencode/fmd_vaccinations.csv")
SERO_MONITOR_CSV = Path("C:/Users/kavya/AppData/Local/Temp/opencode/fmd_seromonitoring.csv")
SERO_SURVEIL_CSV = Path("C:/Users/kavya/AppData/Local/Temp/opencode/fmd_serosurveillance.csv")

VACC_SOURCE = "FMD NADCP vaccination rounds 1-6 (artpark #0086 / DAHD)"
MONITOR_SOURCE = "NIVEDI NADRES FMD seromonitoring (artpark #0087)"
SURVEIL_SOURCE = "NIVEDI NADRES FMD serosurveillance (artpark #0089)"


def _to_int(v) -> int:
    try:
        if pd.isna(v):
            return 0
        return int(float(v))
    except (ValueError, TypeError):
        return 0


def _to_float(v) -> float | None:
    try:
        if pd.isna(v):
            return None
        return round(float(v), 1)
    except (ValueError, TypeError):
        return None


def _title(name: str) -> str:
    return name.strip().title()


def parse_vaccinations(df: pd.DataFrame) -> list[dict]:
    agg: dict[tuple, dict] = {}
    for _, row in df.iterrows():
        key = (
            str(row["state.name"]).strip(),
            str(row["district.name"]).strip(),
            _to_int(row.get("metadata.vaccinationRound")),
            "FMD",
        )
        entry = agg.setdefault(
            key,
            {
                "state": key[0],
                "district": key[1],
                "vaccination_round": key[2],
                "vaccine_name": "FMD",
                "total_vaccinations": 0,
                "farmers_benefited": 0,
                "source": VACC_SOURCE,
            },
        )
        entry["total_vaccinations"] += _to_int(row.get("totalVaccinations.count"))
        entry["farmers_benefited"] += _to_int(row.get("farmersBenefited.count"))
    return list(agg.values())


def parse_seromonitoring(df: pd.DataFrame) -> list[dict]:
    records = []
    for _, row in df.iterrows():
        records.append({
            "year": _to_int(row.get("metadata.year")),
            "disease_name": _title(str(row.get("metadata.diseaseName", "FMD"))),
            "state": str(row["state.name"]).strip(),
            "surveillance_type": "seromonitoring",
            "round_number": _to_int(row.get("metadata.round")) or None,
            "sample_size": _to_int(row.get("prevac.sample")) or None,
            "positive_pct": _to_float(row.get("prevac.positive.O.pct")),
            "details": {
                "program": str(row.get("metadata.program", "")).strip(),
                "prevac": {
                    "sample": _to_int(row.get("prevac.sample")) or None,
                    "serotype_O_pct": _to_float(row.get("prevac.positive.O.pct")),
                    "serotype_A_pct": _to_float(row.get("prevac.positive.A.pct")),
                    "serotype_Asia1_pct": _to_float(row.get("prevac.positive.asia1.pct")),
                },
                "postvac": {
                    "sample": _to_int(row.get("postvac.sample")) or None,
                    "serotype_O_pct": _to_float(row.get("postvac.positive.O.pct")),
                    "serotype_A_pct": _to_float(row.get("postvac.positive.A.pct")),
                    "serotype_Asia1_pct": _to_float(row.get("postvac.positive.asia1.pct")),
                },
            },
            "source": MONITOR_SOURCE,
        })
    return _dedupe(records)


def _dedupe(records: list[dict]) -> list[dict]:
    seen: dict[tuple, dict] = {}
    for r in records:
        key = (
            r["year"], r["state"], r["disease_name"],
            r["surveillance_type"], r["round_number"],
        )
        seen.setdefault(key, r)
    return list(seen.values())


def parse_serosurveillance(df: pd.DataFrame) -> list[dict]:
    records = []
    for _, row in df.iterrows():
        records.append({
            "year": _to_int(row.get("metadata.year")),
            "disease_name": _title(str(row.get("metadata.diseaseName", "FMD"))),
            "state": str(row["state.name"]).strip(),
            "surveillance_type": "serosurveillance",
            "round_number": None,
            "sample_size": _to_int(row.get("sero.sample")) or None,
            "positive_pct": _to_float(row.get("sero.positive.pct")),
            "details": {
                "test": str(row.get("sero.test", "")).strip(),
                "cattle": {
                    "sample": _to_int(row.get("sero.cattle.sample")) or None,
                    "positive_pct": _to_float(row.get("sero.cattle.positive.pct")),
                },
                "buffalo": {
                    "sample": _to_int(row.get("sero.buffalo.sample")) or None,
                    "positive_pct": _to_float(row.get("sero.buffalo.positive.pct")),
                },
            },
            "source": SURVEIL_SOURCE,
        })
    return _dedupe(records)


async def load(records: list[dict], model, schema_name: str) -> None:
    async with async_session_factory() as session:
        await session.execute(delete(model))
        if records:
            session.add_all([model(**r) for r in records])
        await session.commit()
        states = {r["state"] for r in records}
        print(f"{schema_name}: inserted {len(records)} rows | states: {len(states)}")


async def main() -> None:
    for path in (VACC_CSV, SERO_MONITOR_CSV, SERO_SURVEIL_CSV):
        if not path.exists():
            raise FileNotFoundError(f"CSV not found: {path}")

    print(f"loading {VACC_CSV.name} ...")
    vacc = parse_vaccinations(pd.read_csv(VACC_CSV, encoding="utf-8"))
    await load(vacc, DistrictVaccination, "district_vaccinations")

    print(f"loading {SERO_MONITOR_CSV.name} ...")
    monitor = parse_seromonitoring(pd.read_csv(SERO_MONITOR_CSV, encoding="utf-8"))
    print(f"loading {SERO_SURVEIL_CSV.name} ...")
    surveil = parse_serosurveillance(pd.read_csv(SERO_SURVEIL_CSV, encoding="utf-8"))
    await load(monitor + surveil, DiseaseSurveillance, "disease_surveillance (seromonitoring + serosurveillance)")


if __name__ == "__main__":
    asyncio.run(main())