"""Re-create demo/showcase data (users, animals, reports, alerts, etc.).

Useful for demos/presentations. Wipes the DEMO/operational tables first
(users, farmers, veterinarians, animals, symptom_reports, vaccinations,
lab_samples, outbreaks, alerts) and rebuilds them with sample records.

The REAL datasets are never touched:
  - diseases  (AI triage knowledge base)
  - district_livestock_population (20th Livestock Census)
  - district_vaccinations (FMD NADCP)
  - disease_surveillance (NIVEDI)

Demo logins:
  farmer0@example.com / farmer123   (farmer)
  vet0@example.com / vet123         (veterinarian)
  admin@gov.in / admin123           (government officer)

Usage (from the backend/ directory):
    .venv\\Scripts\\python.exe scripts\\reseed_demo_data.py
"""

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from geoalchemy2 import WKTElement
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import JSONB

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import async_session_factory  # noqa: E402
from app.core.security import hash_password as get_password_hash  # noqa: E402
from app.models.alert import Alert, AlertType, AlertSeverity  # noqa: E402
from app.models.animal import Animal, AnimalSpecies, AnimalGender  # noqa: E402
from app.models.disease import Disease  # noqa: E402
from app.models.farmer import Farmer  # noqa: E402
from app.models.lab_sample import LabSample, SampleType, SampleStatus  # noqa: E402
from app.models.outbreak import Outbreak, OutbreakStatus  # noqa: E402
from app.models.symptom_report import SymptomReport, ReportStatus  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.models.vaccination import Vaccination, VaccinationStatus  # noqa: E402
from app.models.veterinarian import Veterinarian  # noqa: E402

RAJASTHAN = {"village": "Rohill", "block": "Khinvsar", "district": "Nagaur", "state": "Rajasthan", "pincode": "341028"}
LNG, LAT = 74.33, 26.87


def point(lng: float, lat: float) -> WKTElement:
    return WKTElement(f"POINT({lng} {lat})", srid=4326)


def now(days_ago: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days_ago)


def future(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


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
    async with async_session_factory() as db:
        from sqlalchemy import text

        for table in OPERATIONAL_TABLES:
            await db.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE'))

        # --- users ---------------------------------------------------------
        admin = User(
            email="admin@gov.in", phone="9000000001", full_name="District Veterinary Officer",
            hashed_password=get_password_hash("admin123"), role=UserRole.govt_officer,
        )
        vet_user = User(
            email="vet0@example.com", phone="9000000002", full_name="Dr. Anil Sharma",
            hashed_password=get_password_hash("vet123"), role=UserRole.veterinarian,
        )
        farmer_user = User(
            email="farmer0@example.com", phone="9000000003", full_name="Ramesh Kumar",
            hashed_password=get_password_hash("farmer123"), role=UserRole.farmer,
            language_preference="hi",
        )
        db.add_all([admin, vet_user, farmer_user])
        await db.flush()

        vet = Veterinarian(
            user_id=vet_user.id, name=vet_user.full_name, phone=vet_user.phone,
            specialization="Large Animal Medicine", qualification="BVSc & AH",
            registration_number="VET-RJ-0417", district=RAJASTHAN["district"],
            location=point(LNG, LAT), is_available=True,
        )
        farmer = Farmer(
            user_id=farmer_user.id, name=farmer_user.full_name, phone=farmer_user.phone,
            **RAJASTHAN, location=point(LNG, LAT), farm_size_acres=12.5, livestock_count=8,
        )
        db.add_all([vet, farmer])

        farmer2_user = User(
            email="farmer2@example.com", phone="9000000004", full_name="Sita Devi",
            hashed_password=get_password_hash("farmer123"), role=UserRole.farmer,
            language_preference="hi",
        )
        db.add(farmer2_user)
        await db.flush()
        farmer2 = Farmer(
            user_id=farmer2_user.id, name=farmer2_user.full_name, phone=farmer2_user.phone,
            village="Dewana", block=RAJASTHAN["block"], district=RAJASTHAN["district"],
            state=RAJASTHAN["state"], pincode=RAJASTHAN["pincode"],
            location=point(LNG + 0.02, LAT - 0.01), farm_size_acres=8.0, livestock_count=2,
        )
        db.add(farmer2)
        await db.flush()

        # --- animals -------------------------------------------------------
        animals = [
            Animal(tag_number="PSR-100101", name="Lakshmi", species=AnimalSpecies.cattle,
                   breed="Gir", gender=AnimalGender.female, owner_id=farmer.id, location=point(LNG, LAT)),
            Animal(tag_number="PSR-100102", name="Ganga", species=AnimalSpecies.cattle,
                   breed="Sahiwal", gender=AnimalGender.female, owner_id=farmer.id, location=point(LNG + 0.002, LAT)),
            Animal(tag_number="PSR-100103", name="Bhola", species=AnimalSpecies.buffalo,
                   breed="Murrah", gender=AnimalGender.male, owner_id=farmer.id, location=point(LNG, LAT + 0.003)),
            Animal(tag_number="PSR-100104", name="Shanti", species=AnimalSpecies.goat,
                   breed="Sirohi", gender=AnimalGender.female, owner_id=farmer.id, location=point(LNG - 0.001, LAT)),
            Animal(tag_number="PSR-100105", name="Kalu", species=AnimalSpecies.goat,
                   breed="Jakhrana", gender=AnimalGender.male, owner_id=farmer.id, location=point(LNG + 0.001, LAT + 0.001)),
            Animal(tag_number="PSR-100106", name="Radha", species=AnimalSpecies.cattle,
                   breed="Rathi", gender=AnimalGender.female, owner_id=farmer.id, location=point(LNG, LAT)),
            Animal(tag_number="PSR-100107", name="Moti", species=AnimalSpecies.sheep,
                   breed="Marwari", gender=AnimalGender.female, owner_id=farmer.id, location=point(LNG + 0.002, LAT + 0.002)),
            Animal(tag_number="PSR-100108", name="Champa", species=AnimalSpecies.cattle,
                   breed="Tharparkar", gender=AnimalGender.female, owner_id=farmer.id, location=point(LNG + 0.001, LAT - 0.002)),
            Animal(tag_number="PSR-100201", name="Ganga", species=AnimalSpecies.buffalo,
                   breed="Nili-Ravi", gender=AnimalGender.female, owner_id=farmer2.id, location=point(LNG + 0.02, LAT - 0.01)),
            Animal(tag_number="PSR-100202", name="Heera", species=AnimalSpecies.goat,
                   breed="Sirohi", gender=AnimalGender.female, owner_id=farmer2.id, location=point(LNG + 0.021, LAT - 0.012)),
        ]
        db.add_all(animals)
        await db.flush()

        # --- symptom reports ----------------------------------------------
        reports = [
            SymptomReport(
                reporter_id=farmer_user.id, animal_id=animals[0].id, animal_species="cattle",
                symptoms=["mouth_lesions", "excessive_salivation", "fever", "lameness"],
                description="Lakshmi stopped eating, has blisters in mouth and hooves.",
                severity="high", location=point(LNG, LAT), village=RAJASTHAN["village"],
                district=RAJASTHAN["district"], status=ReportStatus.triaged,
                triage_result={
                    "triage": "high_risk",
                    "confidence": 0.86,
                    "primary_suspect": "Foot & Mouth Disease",
                    "recommendation": "Isolate the animal and contact the veterinary officer immediately.",
                },
            ),
            SymptomReport(
                reporter_id=farmer_user.id, animal_id=animals[2].id, animal_species="buffalo",
                symptoms=["fever", "weakness", "reduced_milk_yield"],
                description="Bhola feverish since two days, milk yield dropped sharply.",
                severity="medium", location=point(LNG, LAT + 0.003),
                village=RAJASTHAN["village"], district=RAJASTHAN["district"], status=ReportStatus.triaged,
                triage_result={"triage": "medium_risk", "confidence": 0.61,
                               "possible_conditions": ["Mastitis", "Tick Fever"]},
            ),
            SymptomReport(
                reporter_id=farmer_user.id, animal_id=animals[3].id, animal_species="goat",
                symptoms=["coughing", "runny_nose", "weight_loss"],
                description="Shanti coughing and not eating properly.",
                severity="low", location=point(LNG - 0.001, LAT), village=RAJASTHAN["village"],
                district=RAJASTHAN["district"], status=ReportStatus.resolved,
                triage_result={"triage": "low_risk", "primary_suspect": "Respiratory infection"},
            ),
            SymptomReport(
                reporter_id=farmer_user.id, animal_id=animals[7].id, animal_species="cattle",
                symptoms=["fever", "skin_lesions", "swelling"],
                description="Champa has fever and raised nodules on skin.",
                severity="high", location=point(LNG + 0.001, LAT - 0.002),
                village=RAJASTHAN["village"], district=RAJASTHAN["district"], status=ReportStatus.reported,
                triage_result={"triage": "high_risk", "primary_suspect": "Lumpy Skin Disease",
                               "confidence": 0.78,
                               "recommendation": "Report to nearest dispensary; control vectors."},
            ),
            SymptomReport(
                reporter_id=farmer2_user.id, animal_id=animals[8].id, animal_species="buffalo",
                symptoms=["fever", "reduced_milk_yield", "loss_of_appetite"],
                description="Ganga's milk stopped, high fever since yesterday.",
                severity="medium", location=point(LNG + 0.02, LAT - 0.01),
                village="Dewana", district=RAJASTHAN["district"], status=ReportStatus.triaged,
                triage_result={"triage": "medium_risk", "confidence": 0.66,
                               "possible_conditions": ["Theileriosis", "Mastitis"]},
            ),
            SymptomReport(
                reporter_id=farmer2_user.id, animal_id=animals[9].id, animal_species="goat",
                symptoms=["diarrhoea", "weakness"],
                description="Heera has watery stool since two days.",
                severity="low", location=point(LNG + 0.021, LAT - 0.012),
                village="Dewana", district=RAJASTHAN["district"], status=ReportStatus.reported,
                triage_result={"triage": "low_risk", "primary_suspect": "Parasitic gastroenteritis"},
            ),
        ]
        db.add_all(reports)
        await db.flush()

        # --- vaccinations --------------------------------------------------
        vaccinations = [
            Vaccination(animal_id=animals[0].id, vaccine_name="Nava-FMD Trivalent",
                        disease_name="Foot & Mouth Disease", batch_number="FMD-2026B-017",
                        administered_by=vet.id, date_administered=now(180),
                        next_due_date=future(7), dose_number=1, status=VaccinationStatus.completed),
            Vaccination(animal_id=animals[1].id, vaccine_name="Nava-FMD Trivalent",
                        disease_name="Foot & Mouth Disease", batch_number="FMD-2026B-017",
                        administered_by=vet.id, date_administered=now(180),
                        next_due_date=future(20), dose_number=1, status=VaccinationStatus.completed),
            Vaccination(animal_id=animals[2].id, vaccine_name="Brucellosis (B. abortus)",
                        disease_name="Brucellosis", batch_number="BRU-2026A-02",
                        administered_by=vet.id, date_administered=now(90),
                        next_due_date=now(275), dose_number=1, status=VaccinationStatus.completed),
            Vaccination(animal_id=animals[3].id, vaccine_name="PPR Vaccine",
                        disease_name="Peste des Petits Ruminants", batch_number="PPR-2026C-09",
                        administered_by=vet.id, date_administered=now(10),
                        next_due_date=now(635), dose_number=1, status=VaccinationStatus.completed),
            Vaccination(animal_id=animals[7].id, vaccine_name="Nava-FMD Trivalent",
                        disease_name="Foot & Mouth Disease", batch_number="FMD-2026B-021",
                        administered_by=vet.id, date_administered=now(2),
                        next_due_date=future(182), dose_number=1, status=VaccinationStatus.completed),
            Vaccination(animal_id=animals[8].id, vaccine_name="Nava-FMD Trivalent",
                        disease_name="Foot & Mouth Disease", batch_number="FMD-2026B-021",
                        administered_by=vet.id, date_administered=now(-20),
                        next_due_date=now(172), dose_number=1, status=VaccinationStatus.completed),
            Vaccination(animal_id=animals[5].id, vaccine_name="Nava-FMD Trivalent",
                        disease_name="Foot & Mouth Disease", batch_number="FMD-2026B-021",
                        administered_by=vet.id, date_administered=now(-21),
                        next_due_date=now(365), dose_number=1, status=VaccinationStatus.scheduled),
            Vaccination(animal_id=animals[4].id, vaccine_name="ETEC Colibacillosis",
                        disease_name="Colibacillosis", batch_number="COL-2026A-01",
                        administered_by=vet.id, date_administered=now(175),
                        next_due_date=future(28), dose_number=1, status=VaccinationStatus.scheduled),
            Vaccination(animal_id=animals[9].id, vaccine_name="PPR Vaccine",
                        disease_name="Peste des Petits Ruminants", batch_number="PPR-2026C-10",
                        administered_by=vet.id, date_administered=now(30),
                        next_due_date=now(30), dose_number=1, status=VaccinationStatus.scheduled),
            Vaccination(animal_id=animals[6].id, vaccine_name="Enterotoxaemia Vaccine",
                        disease_name="Enterotoxaemia", batch_number="ETV-2026D-04",
                        administered_by=vet.id, date_administered=now(1),
                        next_due_date=now(15), dose_number=1, status=VaccinationStatus.scheduled),
        ]
        db.add_all(vaccinations)

        # --- alerts --------------------------------------------------------
        alerts = [
            Alert(title="FMD outbreak risk in Nagaur", message="Multiple FMD cases reported nearby. "
                   "Vaccinate young stock and restrict animal movement.",
                   alert_type=AlertType.outbreak, severity=AlertSeverity.high,
                   district=RAJASTHAN["district"], target_audience=["farmer", "veterinarian", "govt_officer"],
                   created_by=admin.id, expires_at=now(-15)),
            Alert(title="Weather: unseasonal rain expected", message="Expected rainfall may increase "
                   "mosquito/vector activity. Keep shelter dry and hay protected.",
                   alert_type=AlertType.weather_advisory, severity=AlertSeverity.medium,
                   district=RAJASTHAN["district"], target_audience=["farmer"], created_by=admin.id),
            Alert(title="Vaccination reminder — FMD booster due", message="Booster dose of FMD vaccine "
                   "is due for cattle & buffalo. Nearest veterinary dispensary contact available.",
                   alert_type=AlertType.vaccination_reminder, severity=AlertSeverity.medium,
                   district=RAJASTHAN["district"], target_audience=["farmer"], created_by=admin.id),
        ]
        db.add_all(alerts)

        # --- outbreaks -----------------------------------------------------
        diseases = (await db.execute(select(Disease))).scalars().all()
        fmd = next((d for d in diseases if "foot" in d.name.lower() or "fmd" in d.name.lower()), diseases[0])
        outbreaks = [
            Outbreak(disease_id=fmd.id, confirmed_by=vet.id, district=RAJASTHAN["district"],
                     block=RAJASTHAN["block"], affected_villages=[RAJASTHAN["village"], "Dewana", "Gothara"],
                     affected_animal_count=48, confirmed_cases=12, deaths=3, location=point(LNG, LAT),
                     status=OutbreakStatus.confirmed, risk_level="high", start_date=now(25), notes="Ring vaccination ongoing."),
            Outbreak(disease_id=fmd.id, district="Jodhpur", block="Bhopalgarh",
                     affected_villages=["Cherai", "Tunwara"], affected_animal_count=22,
                     confirmed_cases=5, deaths=1, location=point(73.1, 26.4),
                     status=OutbreakStatus.suspected, risk_level="medium", start_date=now(5)),
        ]
        db.add_all(outbreaks)

        # --- lab samples ---------------------------------------------------
        samples = [
            LabSample(sample_id="LS-NAG-001", animal_id=animals[0].id,
                      symptom_report_id=reports[0].id, sample_type=SampleType.swab,
                      collected_by=vet_user.id, collection_date=now(24), lab_id="LAB-NADRES-JPR",
                      status=SampleStatus.received, result="pending"),
            LabSample(sample_id="LS-NAG-002", animal_id=animals[2].id,
                      symptom_report_id=reports[1].id, sample_type=SampleType.blood,
                      collected_by=vet_user.id, collection_date=now(2), lab_id="LAB-NADRES-JPR",
                      status=SampleStatus.in_transit),
            LabSample(sample_id="LS-NAG-003", animal_id=animals[7].id,
                      symptom_report_id=reports[3].id, sample_type=SampleType.blood,
                      collected_by=vet_user.id, collection_date=now(1), lab_id="LAB-NADRES-JPR",
                      status=SampleStatus.collected),
            LabSample(sample_id="LS-NAG-004", animal_id=animals[8].id,
                      symptom_report_id=reports[4].id, sample_type=SampleType.milk,
                      collected_by=vet_user.id, collection_date=now(3), lab_id="LAB-NADRES-JPR",
                      status=SampleStatus.testing, result="in progress"),
            LabSample(sample_id="LS-NAG-005", animal_id=animals[3].id,
                      symptom_report_id=reports[2].id, sample_type=SampleType.feces,
                      collected_by=vet_user.id, collection_date=now(20), lab_id="LAB-NADRES-JPR",
                      status=SampleStatus.completed,
                      result="No parasitic ova detected", result_details="Normal"),
        ]
        db.add_all(samples)

        await db.commit()
        print("Demo data re-created.")

        print("Logins:")
        print("  farmer0@example.com / farmer123  (farmer, Nagaur)")
        print("  farmer2@example.com / farmer123  (second farmer)")
        print("  vet0@example.com / vet123        (veterinarian)")
        print("  admin@gov.in / admin123          (govt officer)")


if __name__ == "__main__":
    asyncio.run(main())