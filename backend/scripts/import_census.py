"""Import the 20th Livestock Census (2019) all-India district-wise
population data into the district_livestock_population table.

Source: Department of Animal Husbandry and Dairying (GoI), official
20th Livestock Census 2019, Open Government Data / DAHD statistics.

Usage (from the backend/ directory):
    .venv\\Scripts\\python.exe scripts\\import_census.py [path-to-csv]

Default CSV: the aggregated all-India file
  (all-india-20th-livestock-census.csv)
"""

import asyncio
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import delete

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import async_session_factory  # noqa: E402
from app.models.livestock_population import DistrictLivestockPopulation  # noqa: E402

SPECIES = ["cattle", "buffalo", "sheep", "goat", "pig"]
CENSUS_YEAR = 2019
SOURCE = "20th Livestock Census (2019) - DAHD/OGD"

DEFAULT_CSV = Path("C:/Users/kavya/AppData/Local/Temp/opencode/all-india-lsc2019.csv")


def aggregate(csv_path: Path) -> dict[tuple[str, str, str], tuple[int, int]]:
    df = pd.read_csv(csv_path, encoding="utf-8")
    out: dict[tuple[str, str, str], tuple[int, int]] = {}

    for species in SPECIES:
        male_col = f"population.{species}.male"
        female_col = f"population.{species}.female"
        if male_col not in df.columns or female_col not in df.columns:
            print(f"skip species={species}: columns not found")
            continue

        sub = df[["state.name", "district.name", male_col, female_col]].copy()
        sub.columns = ["state", "district", "male", "female"]
        sub["male"] = pd.to_numeric(sub["male"], errors="coerce").fillna(0).astype(int)
        sub["female"] = pd.to_numeric(sub["female"], errors="coerce").fillna(0).astype(int)
        sub = sub.dropna(subset=["state", "district"])

        grouped = sub.groupby(["state", "district"], as_index=False)[["male", "female"]].sum()
        for _, row in grouped.iterrows():
            out[(row["state"], row["district"], species)] = (int(row["male"]), int(row["female"]))

    return out


async def load(rows: dict[tuple[str, str, str], tuple[int, int]]) -> None:
    async with async_session_factory() as session:
        await session.execute(
            delete(DistrictLivestockPopulation).where(
                DistrictLivestockPopulation.census_year == CENSUS_YEAR
            )
        )

        records = []
        for (state, district, species), (male, female) in rows.items():
            records.append({
                "state": state,
                "district": district,
                "species": species,
                "male": male,
                "female": female,
                "total": male + female,
                "census_year": CENSUS_YEAR,
                "source": SOURCE,
            })

        session.add_all([DistrictLivestockPopulation(**r) for r in records])
        await session.commit()

        total = len(records)
        states = {r["state"] for r in records}
        districts = {(r["state"], r["district"]) for r in records}
        print(f"inserted {total} species-district rows")
        print(f"states: {len(states)} | (state,district) pairs: {len(districts)}")


async def main(csv_path: Path) -> None:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    print(f"aggregating {csv_path.name} ...")
    rows = aggregate(csv_path)
    await load(rows)


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    asyncio.run(main(path))