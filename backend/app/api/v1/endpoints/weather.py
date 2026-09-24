from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.triage import WEATHER_RISK_MAP
from app.services.weather import get_current_weather, get_forecast

router = APIRouter()


@router.get("/risk-assessment", response_model=dict)
async def get_weather_risk(
    latitude: float = Query(...),
    longitude: float = Query(...),
    condition: str = Query(
        "auto",
        description="auto (live Open-Meteo) | normal, heavy_rain, high_humidity, flooding, heat_wave, cold_wave",
    ),
    temperature: Optional[float] = Query(None),
    humidity: Optional[float] = Query(None),
    live: bool = Query(True, description="Fetch real-time observations from Open-Meteo"),
    _: User = Depends(get_current_user),
) -> dict:
    condition_key = condition.lower()

    live_weather = None
    if live:
        live_weather = await get_current_weather(latitude, longitude)

    eff_condition = condition_key
    eff_temperature = temperature
    eff_humidity = humidity
    condition_source = "param" if condition_key not in ("auto", "live") else "fallback"
    fetched_at = None

    if live_weather is not None:
        condition_source = "live"
        fetched_at = live_weather.get("observed_at")
        if condition_key in ("auto", "live"):
            eff_condition = live_weather["condition"]
        eff_temperature = live_weather.get("temperature") if temperature is None else temperature
        eff_humidity = live_weather.get("humidity") if humidity is None else humidity

    if eff_condition != "normal" and eff_condition not in WEATHER_RISK_MAP:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown condition: {eff_condition}")

    affected_diseases = []
    if eff_condition != "normal":
        multipliers = WEATHER_RISK_MAP.get(eff_condition, {})
        for disease_code, multiplier in sorted(multipliers.items(), key=lambda x: x[1], reverse=True):
            affected_diseases.append({
                "disease_code": disease_code,
                "risk_multiplier": multiplier,
                "risk_level": (
                    "critical" if multiplier >= 2.0 else
                    "high" if multiplier >= 1.6 else
                    "medium"
                ),
            })

    overall = "low"
    if eff_condition in ("flooding", "heavy_rain"):
        overall = "high"
    elif eff_condition in ("high_humidity", "heat_wave", "cold_wave"):
        overall = "medium"

    return {
        "location": {"latitude": latitude, "longitude": longitude},
        "condition": eff_condition,
        "condition_source": condition_source,
        "live": live_weather is not None,
        "fetched_at": fetched_at,
        "temperature": eff_temperature,
        "humidity": eff_humidity,
        "wind_speed": live_weather.get("wind_speed") if live_weather else None,
        "precipitation": live_weather.get("precipitation") if live_weather else None,
        "overall_risk_level": overall,
        "affected_diseases": affected_diseases,
        "recommendations": _get_recommendations(eff_condition, overall),
    }


@router.get("/forecast", response_model=dict)
async def weather_forecast(
    latitude: float = Query(...),
    longitude: float = Query(...),
    _: User = Depends(get_current_user),
) -> dict:
    rows = await get_forecast(latitude, longitude)
    if rows is None:
        return {"live": False, "days": []}
    return {"live": True, "days": rows}


def _get_recommendations(condition: str, overall_risk: str) -> list[str]:
    recommendations = [
        "Maintain proper shelter and ventilation for livestock",
        "Ensure clean drinking water is available",
        "Keep vaccination records up to date",
    ]

    if condition == "heavy_rain":
        recommendations.append("Move animals to higher, dry ground to avoid foot rot and infections")
    elif condition == "flooding":
        recommendations.append("Immediately relocate animals to safe high ground and restrict movement")
        recommendations.append("Watch for waterborne diseases like Anthrax and HS")
    elif condition == "heat_wave":
        recommendations.append("Provide shade and extra water; avoid transportation during peak heat")
    elif condition == "cold_wave":
        recommendations.append("Provide warm shelter and increased nutrition to maintain body condition")

    if overall_risk == "high":
        recommendations.append("Increase surveillance frequency and report any unusual symptoms immediately")

    return recommendations