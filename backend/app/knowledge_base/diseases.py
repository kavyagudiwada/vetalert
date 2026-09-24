LIVESTOCK_DISEASES_KB: dict = {
    "fmd": {
        "name": "Foot and Mouth Disease (FMD)",
        "name_local": "मुखपका",
        "scientific_name": "Aphthovirus",
        "species_affected": ["cattle", "buffalo", "sheep", "goat", "pig"],
        "symptoms": [
            "vesicles",
            "blisters_on_mouth",
            "excessive_salivation",
            "lameness",
            "fever",
            "reduced_appetite",
            "drooling",
            "udder_lesions",
            "weight_loss",
            "milk_yield_decrease"
        ],
        "transmission_mode": "Direct contact, airborne aerosol, contaminated feed/water, fomites",
        "incubation_period": "2-14 days",
        "severity": "high",
        "is_zoonotic": False,
        "prevention_guidelines": "Annual vaccination; strict quarantine of newly introduced animals; disinfection of premises and vehicles; control animal movement; proper disposal of carcasses",
        "treatment_protocol": "No specific cure; supportive care with antiseptic mouth wash, soft feeding, anti-inflammatories; antibiotics for secondary infections",
        "vaccine": "FMD vaccine (trivalent/bivalent), biannual in high-risk areas",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["high_humidity", "animal_movement", "poor_biosecurity", "rainy_season"]
    },
    "brucellosis": {
        "name": "Brucellosis",
        "name_local": "ब्रुसेलोसिस",
        "scientific_name": "Brucella abortus / B. melitensis",
        "species_affected": ["cattle", "buffalo", "sheep", "goat"],
        "symptoms": [
            "abortion",
            "stillbirth",
            "retained_placenta",
            "infertility",
            "swollen_joints",
            "milk_decrease",
            "swollen_testicles_in_males",
            "weakness"
        ],
        "transmission_mode": "Contact with aborted fetus/placenta, contaminated environment, milk, sexual transmission",
        "incubation_period": "2 weeks to several months",
        "severity": "high",
        "is_zoonotic": True,
        "prevention_guidelines": "Test-and-slaughter programs; calf vaccination (strain 19/B. abortus RB51); strict biosecurity; proper handling and disposal of aborted materials; pasteurize milk; PPE for farm workers",
        "treatment_protocol": "No effective treatment in animals; usually culled; antibiotics (oxytetracycline + streptomycin) may be used in valuable animals under supervision",
        "vaccine": "Brucella abortus S19 for calves; RB51 for adult cattle",
        "reported_in_wet_warm_season": False,
        "risk_factors": ["abortion_history", "shared_pasture", "introduced_animals", "dense_herd"]
    },
    "rabies": {
        "name": "Rabies",
        "name_local": "रेबीज",
        "scientific_name": "Rabies lyssavirus",
        "species_affected": ["cattle", "buffalo", "sheep", "goat", "pig", "equine", "other"],
        "symptoms": [
            "aggression",
            "excessive_salivation",
            "incoordination",
            "paralysis",
            "drooping_jaw",
            "changed_vocalization",
            "hypersensitivity",
            "fever",
            "seizures"
        ],
        "transmission_mode": "Bite from infected animal, saliva contact with mucous membranes or broken skin",
        "incubation_period": "2 weeks to 6 months",
        "severity": "critical",
        "is_zoonotic": True,
        "prevention_guidelines": "Vaccination of domestic animals (annual); avoid exposure to stray/wild animals; immediate post-exposure care; quarantine of biting animals",
        "treatment_protocol": "No treatment; fatal once clinical signs appear; immediate destruction advised; post-exposure prophylaxis for exposed humans",
        "vaccine": "Rabies vaccine (annual)",
        "reported_in_wet_warm_season": False,
        "risk_factors": ["stray_contact", "wildlife_contact", "unvaccinated_herd"]
    },
    "hs": {
        "name": "Haemorrhagic Septicaemia (HS)",
        "name_local": "गलघोंटू",
        "scientific_name": "Pasteurella multocida",
        "species_affected": ["cattle", "buffalo"],
        "symptoms": [
            "high_fever",
            "submandibular_edema",
            "swollen_throat",
            "respiratory_distress",
            "excessive_salivation",
            "brisket_edema",
            "sudden_death",
            "nasal_discharge",
            "depression",
            "recumbency"
        ],
        "transmission_mode": "Inhalation or ingestion of contaminated material; carrier animals; contaminated water",
        "incubation_period": "1-3 days",
        "severity": "critical",
        "is_zoonotic": False,
        "prevention_guidelines": "Annual vaccination before monsoon; avoid stress, overcrowding; provide clean drinking water; isolate sick animals; proper hygiene",
        "treatment_protocol": "Early treatment with oxytetracycline or penicillin + streptomycin (high dose); supportive therapy with fluids and anti-inflammatories",
        "vaccine": "HS vaccine (annual, before monsoon)",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["monsoon_onset", "overcrowding", "stress", "poor_housing", "flooding"]
    },
    "bq": {
        "name": "Black Quarter (BQ)",
        "name_local": "पांगुड़िया",
        "scientific_name": "Clostridium chauvoei",
        "species_affected": ["cattle", "buffalo", "sheep", "goat"],
        "symptoms": [
            "sudden_death",
            "swelling_of_muscles",
            "crepitant_swelling",
            "lameness",
            "fever",
            "depression",
            "loss_of_appetite",
            "gaseous_gangrene",
            "limb_swelling"
        ],
        "transmission_mode": "Soil-borne spores enter through wounds or ingestion; endogenous reactivation",
        "incubation_period": "1-5 days",
        "severity": "critical",
        "is_zoonotic": False,
        "prevention_guidelines": "Annual vaccination; move animals to clean pasture during outbreaks; proper wound care; avoid grazing near contaminated land",
        "treatment_protocol": "Early treatment with penicillin G (high dose), anti-inflammatory drugs; surgical drainage of gangrenous tissue; supportive therapy",
        "vaccine": "BQ vaccine (annual); combined with HS as combined vaccine",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["rainy_season", "soil_contamination", "wounds", "young_animals"]
    },
    "anthrax": {
        "name": "Anthrax",
        "name_local": "एन्थ्रेक्स",
        "scientific_name": "Bacillus anthracis",
        "species_affected": ["cattle", "buffalo", "sheep", "goat"],
        "symptoms": [
            "sudden_death",
            "high_fever",
            "bloody_discharge",
            "swollen_neck",
            "shivering",
            "convulsions",
            "dark_blood_from_orifices",
            "rapid_decomposition",
            "depression"
        ],
        "transmission_mode": "Ingestion of spores from contaminated soil, water, feed; inhalation; flies as mechanical vectors",
        "incubation_period": "1-14 days",
        "severity": "critical",
        "is_zoonotic": True,
        "prevention_guidelines": "Annual vaccination; never open carcasses of suspected anthrax; proper disposal (deep burial with lime or incineration); disinfection of contaminated areas; avoid infected carcass handling without PPE",
        "treatment_protocol": "High-dose penicillin or oxytetracycline in early stages; usually fatal in peracute cases; quarantine affected premises",
        "vaccine": "Anthrax vaccine (annual)",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["flooding", "soil_disturbance", "endemic_area", "grazing_contaminated_land"]
    },
    "ccpp": {
        "name": "Contagious Caprine Pleuropneumonia (CCPP)",
        "name_local": "सीसीपीपी",
        "scientific_name": "Mycoplasma capricolum subsp. capripneumoniae",
        "species_affected": ["goat"],
        "symptoms": [
            "high_fever",
            "respiratory_distress",
            "cough",
            "nasal_discharge",
            "chest_pain",
            "labored_breathing",
            "depression",
            "loss_of_appetite",
            "death"
        ],
        "transmission_mode": "Aerosol droplets, direct contact, contaminated feed/water",
        "incubation_period": "2-6 weeks",
        "severity": "high",
        "is_zoonotic": False,
        "prevention_guidelines": "Vaccination; quarantine new animals; avoid overcrowding; good ventilation; isolate sick animals",
        "treatment_protocol": "Oxytetracycline or tylosin (long course); supportive care; culling of chronic carriers",
        "vaccine": "CCPP vaccine",
        "reported_in_wet_warm_season": False,
        "risk_factors": ["crowding", "introduced_goats", "poor_ventilation", "stress"]
    },
    "ppr": {
        "name": "Peste des Petits Ruminants (PPR / Goat Plague)",
        "name_local": "पीपीआर",
        "scientific_name": "PPR virus (Morbillivirus)",
        "species_affected": ["sheep", "goat"],
        "symptoms": [
            "high_fever",
            "nasal_discharge",
            "ocular_discharge",
            "mouth_lesions",
            "diarrhea",
            "pneumonia",
            "cough",
            "depression",
            "loss_of_appetite",
            "death"
        ],
        "transmission_mode": "Direct contact, aerosol, contaminated feed/water",
        "incubation_period": "3-6 days",
        "severity": "high",
        "is_zoonotic": False,
        "prevention_guidelines": "Annual vaccination; movement control; quarantine new animals; proper hygiene",
        "treatment_protocol": "Supportive care (fluids, antibiotics for secondary infections, antipyretics); no specific antiviral",
        "vaccine": "PPR vaccine (annual)",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["animal_movement", "introduced_animals", "mixed_species", "rainy_season"]
    },
    "newcastle_disease": {
        "name": "Newcastle Disease (Ranikhet)",
        "name_local": "रानीखेत रोग",
        "scientific_name": "Avian paramyxovirus type 1",
        "species_affected": ["poultry"],
        "symptoms": [
            "respiratory_distress",
            "coughing",
            "sneezing",
            "greenish_diarrhea",
            "twisted_neck",
            "paralysis",
            "drop_in_egg_production",
            "swollen_head",
            "nervous_signs",
            "sudden_death"
        ],
        "transmission_mode": "Direct contact, contaminated feed/equipment, airborne, wild birds, contaminated manure",
        "incubation_period": "2-15 days",
        "severity": "high",
        "is_zoonotic": False,
        "prevention_guidelines": "Vaccination (LaSota, R2B strains); biosecurity; proper disinfection; isolate new birds; control wild bird access; quarantine sick flocks",
        "treatment_protocol": "No specific treatment; supportive care; culling severely affected; disinfection of premises",
        "vaccine": "LaSota vaccine (drinking water/spray); R2B vaccine",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["wild_birds", "new_birds", "poor_biosecurity", "crowded_flocks"]
    },
    "fowl_pox": {
        "name": "Fowl Pox",
        "name_local": "कुक्कुट मसूरिका",
        "scientific_name": "Avipoxvirus",
        "species_affected": ["poultry"],
        "symptoms": [
            "warty_lesions_on_comb",
            "lesions_on_wattle",
            "white_spots_in_mouth",
            "respiratory_distress",
            "reduced_egg_production",
            "weight_loss",
            "skin_nodules",
            "lesions_on_legs"
        ],
        "transmission_mode": "Mosquito and biting insects, direct contact, contaminated surfaces",
        "incubation_period": "4-10 days",
        "severity": "medium",
        "is_zoonotic": False,
        "prevention_guidelines": "Vaccination (wing-web method); mosquito control; good hygiene; isolation of infected birds",
        "treatment_protocol": "No specific treatment; supportive care; apply antiseptic to lesions; increase vitamin A",
        "vaccine": "Fowl pox vaccine (wing-web)",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["mosquito_breeding", "rainy_season", "crowding", "poor_hygiene"]
    },
    "mastitis": {
        "name": "Mastitis",
        "name_local": "थनैला",
        "scientific_name": "Multiple bacterial pathogens (S. aureus, Strep. agalactiae, E. coli)",
        "species_affected": ["cattle", "buffalo", "sheep", "goat"],
        "symptoms": [
            "udder_swelling",
            "milk_abnormalities",
            "clots_in_milk",
            "udder_pain",
            "fever",
            "reduced_milk_yield",
            "milk_watery",
            "systemic_illness"
        ],
        "transmission_mode": "Environmental contamination, milking hygiene, teat injury, flies",
        "incubation_period": "Varies (hours to days)",
        "severity": "medium",
        "is_zoonotic": False,
        "prevention_guidelines": "Good milking hygiene; teat dipping; dry cow therapy; culling chronic cases; clean bedding; proper milking machine maintenance",
        "treatment_protocol": "Intramammary antibiotics, systemic antibiotics for severe cases, anti-inflammatories, frequent milking out",
        "vaccine": "No standard vaccine",
        "reported_in_wet_warm_season": True,
        "risk_factors": ["high_humidity", "poor_hygiene", "overcrowding", "fly_infestation"]
    },
    "ibk": {
        "name": "Infectious Bovine Rhinotracheitis (IBR)",
        "name_local": "आईबीआर",
        "scientific_name": "Bovine herpesvirus 1",
        "species_affected": ["cattle", "buffalo"],
        "symptoms": [
            "respiratory_distress",
            "nasal_discharge",
            "cough",
            "fever",
            "red_nose",
            "conjunctivitis",
            "reduced_milk",
            "abortion",
            "infectious_pustular_vulvovaginitis"
        ],
        "transmission_mode": "Direct contact, aerosol, venereal, artificial insemination",
        "incubation_period": "2-6 days",
        "severity": "medium",
        "is_zoonotic": False,
        "prevention_guidelines": "Vaccination; biosecurity; testing and culling of carriers; AI from clean donors",
        "treatment_protocol": "Supportive care, antibiotics for secondary infections, anti-inflammatories",
        "vaccine": "IBR vaccine (marker vaccines available)",
        "reported_in_wet_warm_season": False,
        "risk_factors": ["introduced_animals", "breeding_activity", "stress"]
    },
    "african_swine_fever": {
        "name": "African Swine Fever (ASF)",
        "name_local": "अफ्रीकन स्वाइन फीवर",
        "scientific_name": "ASF virus (Asfarviridae)",
        "species_affected": ["pig"],
        "symptoms": [
            "high_fever",
            "loss_of_appetite",
            "red_skin_blotches",
            "vomiting",
            "diarrhea",
            "abortion",
            "internal_bleeding",
            "sudden_death",
            "depression",
            "weakness"
        ],
        "transmission_mode": "Direct contact, contaminated feed/swill, ticks, fomites",
        "incubation_period": "5-19 days",
        "severity": "critical",
        "is_zoonotic": False,
        "prevention_guidelines": "Strict biosecurity; ban swill feeding; quarantine; movement control; culling infected/in-contact pigs; proper disposal",
        "treatment_protocol": "No treatment; slaughter policy enforced; strict quarantine",
        "vaccine": "No commercial vaccine",
        "reported_in_wet_warm_season": False,
        "risk_factors": ["swill_feeding", "introduced_pigs", "poor_biosecurity", "illegal_movement"]
    }
}


def get_disease_by_name(name: str) -> dict | None:
    for key, disease in LIVESTOCK_DISEASES_KB.items():
        if disease["name"].lower() == name.lower() or key == name.lower():
            return disease
    return None


SYMPTOM_TO_DISEASE_MAP: dict = {
    "vesicles": ["fmd"],
    "blisters_on_mouth": ["fmd"],
    "excessive_salivation": ["fmd", "hs", "rabies"],
    "lameness": ["fmd", "bq"],
    "fever": ["fmd", "hs", "bq", "anthrax", "ccpp", "ppr", "newcastle_disease", "mastitis", "ibk", "asf", "brucellosis"],
    "udder_lesions": ["fmd", "mastitis"],
    "milk_yield_decrease": ["fmd", "brucellosis", "mastitis", "ibk"],
    "abortion": ["brucellosis", "ibk", "asf"],
    "stillbirth": ["brucellosis"],
    "retained_placenta": ["brucellosis"],
    "infertility": ["brucellosis"],
    "swollen_joints": ["brucellosis"],
    "swollen_testicles": ["brucellosis"],
    "aggression": ["rabies"],
    "incoordination": ["rabies"],
    "paralysis": ["rabies", "newcastle_disease"],
    "drooping_jaw": ["rabies"],
    "hypersensitivity": ["rabies"],
    "seizures": ["rabies"],
    "sudden_death": ["hs", "bq", "anthrax", "newcastle_disease", "asf"],
    "submandibular_edema": ["hs"],
    "swollen_throat": ["hs"],
    "respiratory_distress": ["hs", "ccpp", "newcastle_disease", "fowl_pox", "ibk"],
    "nasal_discharge": ["hs", "ccpp", "ppr", "ibk"],
    "swelling_of_muscles": ["bq"],
    "crepitant_swelling": ["bq"],
    "bloody_discharge": ["anthrax"],
    "dark_blood_from_orifices": ["anthrax"],
    "convulsions": ["anthrax"],
    "rapid_decomposition": ["anthrax"],
    "cough": ["ccpp", "ppr", "ibk", "newcastle_disease"],
    "chest_pain": ["ccpp"],
    "ocular_discharge": ["ppr"],
    "mouth_lesions": ["ppr"],
    "diarrhea": ["ppr", "newcastle_disease", "asf"],
    "pneumonia": ["ppr"],
    "coughing": ["newcastle_disease"],
    "sneezing": ["newcastle_disease"],
    "greenish_diarrhea": ["newcastle_disease"],
    "twisted_neck": ["newcastle_disease"],
    "drop_in_egg_production": ["newcastle_disease", "fowl_pox"],
    "swollen_head": ["newcastle_disease"],
    "warty_lesions_on_comb": ["fowl_pox"],
    "white_spots_in_mouth": ["fowl_pox"],
    "skin_nodules": ["fowl_pox"],
    "udder_swelling": ["mastitis"],
    "clots_in_milk": ["mastitis"],
    "udder_pain": ["mastitis"],
    "milk_watery": ["mastitis"],
    "red_nose": ["ibk"],
    "conjunctivitis": ["ibk"],
    "red_skin_blotches": ["asf"],
    "vomiting": ["asf"],
    "internal_bleeding": ["asf"],
    "drooling": ["fmd"],
    "depression": ["hs", "bq", "anthrax", "ccpp", "ppr", "asf"],
    "loss_of_appetite": ["bq", "ccpp", "ppr", "asf"],
    "reduced_appetite": ["fmd"],
    "weight_loss": ["fmd", "fowl_pox"]
}


def get_suspected_diseases(symptoms: list[str], species: str | None = None) -> list[str]:
    disease_scores: dict[str, int] = {}
    for symptom in symptoms:
        norm = symptom.lower().replace(" ", "_")
        matches = SYMPTOM_TO_DISEASE_MAP.get(norm, [])
        for disease_key in matches:
            disease_scores[disease_key] = disease_scores.get(disease_key, 0) + 1

    sorted_diseases = sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)

    if species and species.lower() != "other":
        result = []
        for key, score in sorted_diseases:
            disease = LIVESTOCK_DISEASES_KB.get(key)
            if disease and species in disease["species_affected"]:
                result.append(key)
        return result[:5] if result else [key for key, _ in sorted_diseases[:3]]

    return [key for key, _ in sorted_diseases[:5]]
