VACCINATION_GUIDELINES: dict = {
    "cattle": {
        "vaccines": [
            {
                "name": "FMD Vaccine",
                "disease": "Foot and Mouth Disease",
                "dosage": "2 ml subcutaneous",
                "frequency": "Every 6 months (biannual)",
                "age_to_start": "4 months and above",
                "contraindications": "Do not vaccinate febrile or sick animals",
                "notes": "Trivalent/bivalent vaccine; essential before monsoon"
            },
            {
                "name": "HS Vaccine",
                "disease": "Haemorrhagic Septicaemia",
                "dosage": "2 ml subcutaneous",
                "frequency": "Annual (before monsoon)",
                "age_to_start": "3-6 months",
                "contraindications": "Do not vaccinate unhealthy animals",
                "notes": "Crucial in areas with history of HS outbreaks"
            },
            {
                "name": "BQ Vaccine",
                "disease": "Black Quarter",
                "dosage": "2 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "4-6 months",
                "contraindications": "Do not vaccinate pregnant animals in last trimester",
                "notes": "Can be combined with HS as HS-BQ combined vaccine"
            },
            {
                "name": "Brucellosis Vaccine (S19)",
                "disease": "Brucellosis",
                "dosage": "2 ml subcutaneous",
                "frequency": "Once in lifetime (calves 3-8 months)",
                "age_to_start": "3-8 months",
                "contraindications": "Only female calves; not for adult animals",
                "notes": "Strain 19 vaccine; RB51 for adults on recommendation"
            },
            {
                "name": "IBR Vaccine",
                "disease": "Infectious Bovine Rhinotracheitis",
                "dosage": "2 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "6 months",
                "contraindications": "Not for pregnant animals (some types)",
                "notes": "Marker vaccines recommended for herd screening programs"
            },
            {
                "name": "Anthrax Vaccine",
                "disease": "Anthrax",
                "dosage": "1 ml subcutaneous",
                "frequency": "Annual (before monsoon in endemic areas)",
                "age_to_start": "4-6 months",
                "contraindications": "Do not vaccinate within 2 weeks of other vaccines",
                "notes": "Essential in endemic anthrax zones"
            }
        ],
        "booster_notes": "Booster doses recommended annually for all core vaccines"
    },
    "buffalo": {
        "vaccines": [
            {
                "name": "FMD Vaccine",
                "disease": "Foot and Mouth Disease",
                "dosage": "2 ml subcutaneous",
                "frequency": "Every 6 months",
                "age_to_start": "4 months and above",
                "contraindications": "Do not vaccinate sick animals",
                "notes": "Biannual vaccination recommended for buffalo"
            },
            {
                "name": "HS Vaccine",
                "disease": "Haemorrhagic Septicaemia",
                "dosage": "2 ml subcutaneous",
                "frequency": "Annual (before monsoon)",
                "age_to_start": "3-6 months",
                "contraindications": "Do not vaccinate unhealthy animals",
                "notes": "Buffalo are highly susceptible to HS"
            },
            {
                "name": "BQ Vaccine",
                "disease": "Black Quarter",
                "dosage": "2 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "4-6 months",
                "contraindications": "Do not vaccinate pregnant animals in last trimester",
                "notes": "Combined HS-BQ vaccine commonly used"
            },
            {
                "name": "Brucellosis Vaccine (S19)",
                "disease": "Brucellosis",
                "dosage": "2 ml subcutaneous",
                "frequency": "Once in lifetime (calves 3-8 months)",
                "age_to_start": "3-8 months",
                "contraindications": "Only female calves",
                "notes": "Critical given high brucellosis rates in buffalo"
            }
        ],
        "booster_notes": "Annual boosters for all vaccines; FMD semiannual"
    },
    "sheep": {
        "vaccines": [
            {
                "name": "Enterotoxaemia (ET) Vaccine",
                "disease": "Enterotoxaemia",
                "dosage": "2 ml subcutaneous",
                "frequency": "Biannual",
                "age_to_start": "3 months",
                "contraindications": "Do not vaccinate febrile animals",
                "notes": "Prevents pulpy kidney disease"
            },
            {
                "name": "PPR Vaccine",
                "disease": "Peste des Petits Ruminants",
                "dosage": "1 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "3-4 months",
                "contraindications": "Do not vaccinate pregnant ewes (last trimester)",
                "notes": "Also called Goat Plague vaccine"
            },
            {
                "name": "Anthrax Vaccine",
                "disease": "Anthrax",
                "dosage": "1 ml subcutaneous",
                "frequency": "Annual (endemic areas)",
                "age_to_start": "4 months",
                "contraindications": "Do not vaccinate within 2 weeks of other vaccines",
                "notes": "Recommended in endemic districts"
            },
            {
                "name": "Sheep Pox Vaccine",
                "disease": "Sheep Pox",
                "dosage": "1 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "3 months",
                "contraindications": "Do not vaccinate unhealthy animals",
                "notes": "May be combined with PPR"
            }
        ],
        "booster_notes": "Annual boosters recommended"
    },
    "goat": {
        "vaccines": [
            {
                "name": "PPR Vaccine",
                "disease": "Peste des Petits Ruminants",
                "dosage": "1 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "3-4 months",
                "contraindications": "Do not vaccinate late-pregnant does",
                "notes": "Core vaccine for goats"
            },
            {
                "name": "Enterotoxaemia (ET) Vaccine",
                "disease": "Enterotoxaemia",
                "dosage": "2 ml subcutaneous",
                "frequency": "Biannual",
                "age_to_start": "3 months",
                "contraindications": "Do not vaccinate febrile animals",
                "notes": "Common in intensively managed flocks"
            },
            {
                "name": "CCPP Vaccine",
                "disease": "Contagious Caprine Pleuropneumonia",
                "dosage": "2 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "3-6 months",
                "contraindications": "Do not vaccinate stressed animals",
                "notes": "Important in endemic areas"
            },
            {
                "name": "Goat Pox Vaccine",
                "disease": "Goat Pox",
                "dosage": "1 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "3 months",
                "contraindications": "Do not vaccinate unhealthy animals",
                "notes": "Combined vaccine available with PPR"
            }
        ],
        "booster_notes": "Annual boosters recommended"
    },
    "poultry": {
        "vaccines": [
            {
                "name": "Newcastle Disease (LaSota)",
                "disease": "Newcastle Disease",
                "dosage": "1 drop eye/nostril or drinking water",
                "frequency": "Primary at 1-2 weeks, booster at 4 weeks, then every 3 months",
                "age_to_start": "1 week",
                "contraindications": "Do not vaccinate sick birds",
                "notes": "Use R2B (killed) vaccine for booster in adults"
            },
            {
                "name": "Fowl Pox Vaccine",
                "disease": "Fowl Pox",
                "dosage": "Wing-web stab",
                "frequency": "Once at 6-8 weeks",
                "age_to_start": "6-8 weeks",
                "contraindications": "Do not vaccinate during heat stress",
                "notes": "Give during cool season"
            },
            {
                "name": "Marek's Disease Vaccine",
                "disease": "Marek's Disease",
                "dosage": "0.2 ml subcutaneous (day-old chick)",
                "frequency": "Once at hatchery",
                "age_to_start": "Day old",
                "contraindications": "Must be stored in liquid nitrogen",
                "notes": "Given at hatchery level"
            },
            {
                "name": "Infectious Bursal Disease (IBD) Vaccine",
                "disease": "Gumboro Disease",
                "dosage": "Drinking water",
                "frequency": "At 14 and 24 days",
                "age_to_start": "14 days",
                "contraindications": "Do not vaccinate stressed birds",
                "notes": "Intermediate strain commonly used"
            }
        ],
        "booster_notes": "Follow specific broiler/layer vaccination schedules"
    },
    "pig": {
        "vaccines": [
            {
                "name": "Swine Fever (Classical)",
                "disease": "Classical Swine Fever",
                "dosage": "2 ml subcutaneous",
                "frequency": "Annual",
                "age_to_start": "2-3 months",
                "contraindications": "Do not vaccinate sick animals",
                "notes": "National control program vaccine"
            },
            {
                "name": "Foot and Mouth Disease",
                "disease": "FMD",
                "dosage": "2 ml subcutaneous",
                "frequency": "Biannual",
                "age_to_start": "3 months",
                "contraindications": "Do not vaccinate pregnant sows in late term",
                "notes": "Recommended in FMD hotspots"
            }
        ],
        "booster_notes": "Annual boosters recommended"
    },
    "equine": {
        "vaccines": [
            {
                "name": "Tetanus Toxoid",
                "disease": "Tetanus",
                "dosage": "1 ml subcutaneous",
                "frequency": "Annual, booster before surgery/injury",
                "age_to_start": "4-6 months",
                "contraindications": "Do not vaccinate sick animals",
                "notes": "Core equine vaccine"
            },
            {
                "name": "Equine Influenza Vaccine",
                "disease": "Equine Influenza",
                "dosage": "1 ml intramuscular",
                "frequency": "Every 6 months",
                "age_to_start": "6 months",
                "contraindications": "Do not vaccinate pregnant mares (some types)",
                "notes": "Recommend for boarding/racing horses"
            }
        ],
        "booster_notes": "Annual boosters; biannual for influenza in high-risk string"
    }
}


def get_vaccination_schedule(species: str) -> list[dict]:
    return VACCINATION_GUIDELINES.get(species, {}).get("vaccines", [])


def get_vaccines_for_disease(disease: str) -> list[dict]:
    result = []
    for species, data in VACCINATION_GUIDELINES.items():
        for vaccine in data.get("vaccines", []):
            if vaccine["disease"].lower() == disease.lower() or disease.lower() in vaccine["disease"].lower():
                v = dict(vaccine)
                v["species"] = species
                result.append(v)
    return result
