import logging
from typing import Any, Optional

from app.ml.preprocessor import (
    prepare_prediction_input,
    encode_symptoms,
    normalize_features,
)

logger = logging.getLogger(__name__)


class DiseasePredictionModel:
    def __init__(self) -> None:
        self.model = None
        self.scaler = None
        self.feature_names = None
        self._loaded = False

    def load_model(self, model_path: Optional[str] = None) -> bool:
        try:
            if model_path is None:
                model_path = "app/ml/trained_model.pkl"
            # Attempt to load trained model; if unavailable, fall back to rule-based
            try:
                import joblib
                self.model = joblib.load(model_path)
                self._loaded = True
            except FileNotFoundError:
                logger.warning("Trained model not found, using rule-based fallback")
                self._loaded = False
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self._loaded = False
            return False

    def is_loaded(self) -> bool:
        return self._loaded


model_instance = DiseasePredictionModel()


async def predict_disease_from_symptoms(
    symptoms: list[str],
    species: str,
    features: Optional[dict] = None,
) -> dict[str, Any]:
    if features is None:
        features = {}

    if not model_instance.is_loaded():
        from app.services.triage import calculate_rule_based_risk
        weather = features.get("weather")
        result = calculate_rule_based_risk(symptoms, species, weather)
        return {
            "source": "rule_based",
            "predictions": result["suspected_diseases"],
            "risk_score": result["risk_score"],
            "urgency_level": result["urgency_level"],
            "recommended_action": result["recommended_action"],
        }

    try:
        prepared = prepare_prediction_input(symptoms, species, features)
        encoded = encode_symptoms(prepared["symptoms"])
        normalized = normalize_features(prepared["numeric_features"])
        input_vector = encoded + normalized

        probabilities = self._predict_probabilities(input_vector)

        top_predictions = sorted(
            probabilities.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:5]

        return {
            "source": "ml_model",
            "predictions": [
                {"disease": name, "probability": round(prob, 4)}
                for name, prob in top_predictions
            ],
            "risk_score": max(float(prob) for _, prob in top_predictions) if top_predictions else 0.0,
        }
    except Exception as e:
        logger.error(f"ML prediction failed: {e}")
        raise


def _predict_probabilities(model_input: list[float]) -> dict[str, float]:
    if model_instance.model is not None and hasattr(model_instance.model, "predict_proba"):
        proba = model_instance.model.predict_proba([model_input])[0]
        classes = model_instance.model.classes_
        return {str(c): float(p) for c, p in zip(classes, proba)}
    return {}


async def predict_outbreak_risk(
    district: str,
    recent_cases: int,
    population_at_risk: int,
    weather: Optional[dict] = None,
    season: Optional[str] = None,
) -> dict[str, Any]:
    risk_score = 0.0
    factors = []

    if population_at_risk > 0:
        incidence_rate = recent_cases / population_at_risk
        if incidence_rate > 0.05:
            risk_score += 3.0
            factors.append("high_incidence_rate")
        elif incidence_rate > 0.02:
            risk_score += 2.0
            factors.append("moderate_incidence_rate")
        elif incidence_rate > 0:
            risk_score += 1.0
            factors.append("low_incidence_rate")

    if recent_cases > 50:
        risk_score += 2.0
        factors.append("high_case_count")
    elif recent_cases > 20:
        risk_score += 1.5
        factors.append("moderate_case_count")

    if season in ("monsoon", "post-monsoon"):
        risk_score += 1.5
        factors.append("monsoon_season")

    if weather:
        if weather.get("condition") == "flooding":
            risk_score += 2.5
            factors.append("flooding")
        elif weather.get("condition") == "heavy_rain":
            risk_score += 1.5
            factors.append("heavy_rainfall")
        elif weather.get("condition") == "heat_wave":
            risk_score += 1.0
            factors.append("heat_wave")

    risk_level = "low"
    if risk_score >= 7:
        risk_level = "critical"
    elif risk_score >= 5:
        risk_level = "high"
    elif risk_score >= 3:
        risk_level = "medium"

    return {
        "district": district,
        "risk_level": risk_level,
        "risk_score": round(min(risk_score, 10.0), 2),
        "contributing_factors": factors,
        "recommendation": risk_level,
    }
