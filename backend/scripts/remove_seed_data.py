"""Remove all seeded/demo operational data from the database so the app
runs purely on real datasets and user-generated data.

Deletes all rows from the demo/operational tables:
  users, farmers, veterinarians, animals, symptom_reports, vaccinations,
  lab_samples, outbreaks, alerts.

Keeps untouched (real/reference data already imported):
  - diseases                       (AI triage knowledge base)
  - district_livestock_population  (20th Livestock Census, 2019)
  - district_vaccinations          (FMD NADCP rounds 1-6)
  - disease_surveillance           (NIVEDI serosurveillance/seromonitoring)

Usage (from the backend/ directory):
    .venv\\Scripts\\python.exe scripts\\remove_seed_data.py
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import async_session_factory  # noqa: E402

OPERATIONAL_TABLES = [
    "lab_samples",
    "alerts",
    "vaccinations",
    "outbreaks",
    "symptom_reports",
    "animals",
    "veterinarians",
    "farmers",
    "users",
]


async def main() -> None:
    async with async_session_factory() as session:
        for table in OPERATIONAL_TABLES:
            await session.execute(
                text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE')
            )
        await session.commit()
        print("Removed all seed/demo operational data.")
        print("Kept real datasets:")
        print("  - district_livestock_population (census)")
        print("  - district_vaccinations (FMD NADCP)")
        print("  - disease_surveillance (NIVEDI)")
        print("  - diseases (reference knowledge base)")


if __name__ == "__main__":
    asyncio.run(main())