from typing import Any, Optional

from app.knowledge_base.diseases import (
    LIVESTOCK_DISEASES_KB,
    get_suspected_diseases,
)

SEVERITY_WEIGHTS = {
    "critical": 5,
    "high": 4,
    "medium": 3,
    "low": 2,
}

WEATHER_RISK_MAP: dict[str, dict[str, float]] = {
    "heavy_rain": {
        "fmd": 1.5,
        "hs": 2.0,
        "bq": 1.8,
        "anthrax": 1.6,
        "fowl_pox": 1.5,
        "mastitis": 1.4,
        "newcastle_disease": 1.3,
        "ppr": 1.2,
    },
    "high_humidity": {
        "fmd": 1.4,
        "mastitis": 1.5,
        "fowl_pox": 1.4,
        "hs": 1.3,
    },
    "flooding": {
        "anthrax": 2.0,
        "hs": 1.8,
        "fmd": 1.5,
        "leptospirosis": 1.5,
    },
    "heat_wave": {
        "newcastle_disease": 1.3,
        "fowl_pox": 1.2,
    },
    "cold_wave": {
        "ibk": 1.4,
        "ccpp": 1.5,
        "ppr": 1.3,
    },
}


def normalize_symptom(symptom: str) -> str:
    return symptom.lower().strip().replace(" ", "_")


def calculate_rule_based_risk(
    symptoms: list[str],
    species: str,
    weather: Optional[dict] = None,
) -> dict[str, Any]:
    normalized_symptoms = [normalize_symptom(s) for s in symptoms]
    suspected = get_suspected_diseases(normalized_symptoms, species)

    results = []
    total_score = 0.0
    top_urgency = "low"

    for disease_key in suspected:
        disease = LIVESTOCK_DISEASES_KB.get(disease_key)
        if not disease:
            continue

        score = 0.0
        matched_symptoms = []

        for symptom in normalized_symptoms:
            if symptom in disease["symptoms"]:
                score += 1.0
                matched_symptoms.append(symptom)

        if score == 0:
            continue

        score += SEVERITY_WEIGHTS.get(disease["severity"], 2) * 0.5

        if weather:
            condition = weather.get("condition", "normal")
            multipliers = WEATHER_RISK_MAP.get(condition)
            if multipliers:
                score *= multipliers.get(disease_key, 1.0)
            if weather.get("humidity", 0) > 70:
                humidity_mult = WEATHER_RISK_MAP["high_humidity"].get(disease_key, 1.0)
                score *= humidity_mult

                risk_factors = disease.get("risk_factors", [])
                if "high_humidity" in risk_factors:
                    score *= 1.2

        species_specific_boost = 1.0
        if species and species in disease["species_affected"]:
            species_specific_boost = 1.3
        score *= species_specific_boost

        match_ratio = len(matched_symptoms) / max(len(disease["symptoms"]), 1)
        if match_ratio > 0.35:
            score *= 1.4

        total_score += score

        results.append({
            "disease_code": disease_key,
            "disease_name": disease["name"],
            "name_local": disease.get("name_local"),
            "severity": disease["severity"],
            "is_zoonotic": disease["is_zoonotic"],
            "matched_symptoms": matched_symptoms,
            "confidence_score": round(min(score, 10.0), 2),
            "species_affected": disease["species_affected"],
        })

    results.sort(key=lambda x: x["confidence_score"], reverse=True)

    report_severity = ""
    if total_score >= 15:
        top_urgency = "critical"
        report_severity = "critical"
    elif total_score >= 10:
        top_urgency = "high"
        report_severity = "high"
    elif total_score >= 5:
        top_urgency = "medium"
        report_severity = "medium"
    else:
        top_urgency = "low"
        report_severity = "low"

    top_disease = results[0] if results else None

    recommended_action = _get_recommended_action(top_disease, top_urgency)

    return {
        "risk_score": round(min(total_score, 20.0), 2),
        "urgency_level": top_urgency,
        "suspected_diseases": results[:3] if results else [],
        "recommended_action": recommended_action,
        "report_severity": report_severity,
        "is_zoonotic_risk": any(
            d["is_zoonotic"] for d in results
        ),
    }


def _get_recommended_action(top_disease: Optional[dict], urgency: str) -> dict:
    if urgency == "critical":
        action = {
            "message": "URGENT: Immediate veterinary intervention required. Isolate affected animals.",
            "priority": 1,
            "timeframe": "Immediately (within hours)",
            "steps": [
                "Isolate affected animal immediately",
                "Contact nearest veterinarian / emergency helpline",
                "Do not move animals unless necessary to control spread",
                "Restrict visitor and animal movement in the premise",
            ],
        }
    elif urgency == "high":
        action = {
            "message": "High risk suspected. Veterinary consultation recommended within 24 hours.",
            "priority": 2,
            "timeframe": "Within 24 hours",
            "steps": [
                "Separate affected animal to avoid contact with healthy herd",
                "Schedule veterinary visit as soon as possible",
                "Monitor temperature and symptoms",
                "Maintain records of animal movement",
            ],
        }
    elif urgency == "medium":
        action = {
            "message": "Moderate concern. Monitor animal closely and consult veterinarian if symptoms persist.",
            "priority": 3,
            "timeframe": "Within 48 hours",
            "steps": [
                "Monitor animal's condition twice daily",
                "Ensure adequate nutrition and hydration",
                "Notify veterinarian if condition worsens",
            ],
        }
    else:
        action = {
            "message": "Low risk. Continue monitoring. If symptoms persist, seek veterinary advice.",
            "priority": 4,
            "timeframe": "Within 3-5 days",
            "steps": [
                "Observe animal for symptom progression",
                "Maintain hygiene standards",
                "Report any new symptoms",
            ],
        }

    if top_disease and top_disease.get("is_zoonotic"):
        action["zoonotic_warning"] = (
            "This disease CAN transmit to humans. Use protective gloves/masks when handling "
            "the animal. Wash hands thoroughly. Seek medical advice if exposed."
        )

    return action


def triage_report(
    symptoms: list[str],
    species: str,
    location: Optional[dict] = None,
    weather: Optional[dict] = None,
) -> dict[str, Any]:
    result = calculate_rule_based_risk(symptoms, species, weather)

    if location:
        result["location_context"] = location

    return result
