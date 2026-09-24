from typing import Any, Optional

from app.knowledge_base.diseases import SYMPTOM_TO_DISEASE_MAP

KNOWN_SYMPTOMS: list[str] = sorted(set(SYMPTOM_TO_DISEASE_MAP.keys()))


def encode_symptoms(symptoms: list[str]) -> list[float]:
    normalized = [s.lower().strip().replace(" ", "_") for s in symptoms]
    return [1.0 if sym in normalized else 0.0 for sym in KNOWN_SYMPTOMS]


def normalize_features(features: dict[str, Any]) -> list[float]:
    numeric_values = []
    for value in features.values():
        if isinstance(value, (int, float)):
            numeric_values.append(float(value))
        elif isinstance(value, bool):
            numeric_values.append(1.0 if value else 0.0)
        elif isinstance(value, str) and value.isdigit():
            numeric_values.append(float(value))
        else:
            numeric_values.append(0.0)
    return numeric_values


def prepare_prediction_input(
    symptoms: list[str],
    species: str,
    features: Optional[dict] = None,
) -> dict[str, Any]:
    if features is None:
        features = {}

    species_map = {
        "cattle": 0, "buffalo": 1, "sheep": 2, "goat": 3,
        "pig": 4, "poultry": 5, "equine": 6, "other": 7,
    }
    species_encoded = species_map.get(species.lower(), 7)

    numeric_features = {
        "species": species_encoded,
        "age_years": float(features.get("age_years", 0)),
        "temperature": float(features.get("temperature", 0)),
        "humidity": float(features.get("humidity", 0)),
        "rainfall_mm": float(features.get("rainfall_mm", 0)),
        "season": float(features.get("season_code", 0)),
        "has_history": 1.0 if features.get("has_outbreak_history", False) else 0.0,
        "symptom_count": float(len(symptoms)),
    }

    return {
        "symptoms": symptoms,
        "species": species,
        "numeric_features": numeric_features,
    }


def build_feature_pipeline(
    symptoms: list[str],
    species: str,
    structured_features: Optional[dict] = None,
) -> list[float]:
    prepared = prepare_prediction_input(symptoms, species, structured_features)
    encoded = encode_symptoms(prepared["symptoms"])
    normalized = normalize_features(prepared["numeric_features"])
    return encoded + normalized
