from app.knowledge_base.diseases import get_suspected_diseases
from app.services.triage import calculate_rule_based_risk, normalize_symptom, triage_report


def test_normalize_symptom():
    assert normalize_symptom("High Fever") == "high_fever"
    assert normalize_symptom("  Lameness ") == "lameness"


def test_fmd_triage_for_cattle():
    result = calculate_rule_based_risk(
        ["vesicles", "blisters_on_mouth", "drooling", "fever", "lameness"],
        "cattle",
    )
    top = result["suspected_diseases"][0]
    assert top["disease_code"] == "fmd"
    assert top["severity"] == "high"
    assert result["urgency_level"] in {"high", "critical"}
    assert result["risk_score"] > 0
    assert top["matched_symptoms"] == ["vesicles", "blisters_on_mouth", "drooling", "fever", "lameness"]


def test_zoonotic_warning_is_flagged():
    result = calculate_rule_based_risk(
        ["aggression", "paralysis", "seizures", "excessive_salivation"],
        "cattle",
    )
    assert result["is_zoonotic_risk"] is True
    assert "zoonotic_warning" in result["recommended_action"]


def test_weather_multiplier_increases_anthrax_risk():
    symptoms = ["fever", "depression", "bloody_discharge", "sudden_death"]
    base = calculate_rule_based_risk(symptoms, "cattle")
    rainy = calculate_rule_based_risk(
        symptoms,
        "cattle",
        weather={"condition": "heavy_rain"},
    )

    def anthrax_confidence(result):
        return next(
            d["confidence_score"]
            for d in result["suspected_diseases"]
            if d["disease_code"] == "anthrax"
        )

    assert anthrax_confidence(rainy) > anthrax_confidence(base)


def test_triage_report_includes_location_context():
    result = triage_report(
        ["fever", "drooling"],
        "cattle",
        location={"district": "Pune", "lat": 18.52, "lng": 73.85},
    )
    assert result["location_context"]["district"] == "Pune"


def test_get_suspected_diseases_filters_by_species():
    result = get_suspected_diseases(["chest_pain", "cough"], "goat")
    assert result[0] == "ccpp"


def test_no_matches_returns_empty_suspected():
    result = calculate_rule_based_risk(["unknown_symptom_xyz"], "cattle")
    assert result["risk_score"] == 0
    assert result["suspected_diseases"] == []
    assert result["urgency_level"] == "low"