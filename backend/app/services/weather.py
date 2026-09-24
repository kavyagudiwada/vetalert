import asyncio
import time
from typing import Any, Optional

import httpx

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

_cache: dict[str, tuple[float, Any]] = {}
_CACHE_LOCK = asyncio.Lock()

CURRENT_TTL = 600  # 10 minutes
FORECAST_TTL = 3600  # 1 hour


async def _fetch(url: str) -> Optional[dict]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
    except (httpx.HTTPError, ValueError):
        return None
    return None


def derive_condition(
    temperature: Optional[float],
    humidity: Optional[float],
    precipitation: Optional[float],
    weather_code: Optional[int],
) -> str:
    code = weather_code if isinstance(weather_code, int) else -1
    temp = float(temperature or 25)
    hum = float(humidity or 60)
    precip = float(precipitation or 0)

    rain_codes = {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99}
    snow_codes = {71, 73, 75, 77, 85, 86}
    storm_codes = {95, 96, 99}

    if temp >= 38:
        return "heat_wave"
    if temp <= 8 or code in snow_codes:
        return "cold_wave"
    if code in storm_codes and precip >= 8:
        return "flooding"
    if code in rain_codes or precip >= 10:
        return "flooding" if precip >= 20 else "heavy_rain"
    if hum >= 92:
        return "high_humidity"
    return "normal"


async def get_current_weather(latitude: float, longitude: float) -> Optional[dict]:
    key = f"current:{round(latitude, 3)}:{round(longitude, 3)}"
    now = time.time()
    async with _CACHE_LOCK:
        hit = _cache.get(key)
        if hit and now - hit[0] < CURRENT_TTL:
            return hit[1]

    url = (
        f"{OPEN_METEO_BASE}?latitude={latitude}&longitude={longitude}"
        "&current=temperature_2m,relative_humidity_2m,weather_code,"
        "wind_speed_10m,precipitation&timezone=auto"
    )
    data = await _fetch(url)
    if not data or "current" not in data:
        return None

    cur = data["current"]
    out = {
        "temperature": cur.get("temperature_2m"),
        "humidity": cur.get("relative_humidity_2m"),
        "wind_speed": cur.get("wind_speed_10m"),
        "precipitation": cur.get("precipitation"),
        "weather_code": cur.get("weather_code"),
        "observed_at": cur.get("time"),
        "condition": derive_condition(
            cur.get("temperature_2m"),
            cur.get("relative_humidity_2m"),
            cur.get("precipitation"),
            cur.get("weather_code"),
        ),
        "source": "open-meteo",
    }

    async with _CACHE_LOCK:
        _cache[key] = (time.time(), out)
    return out


async def get_forecast(latitude: float, longitude: float) -> Optional[list]:
    key = f"forecast:{round(latitude, 3)}:{round(longitude, 3)}"
    now = time.time()
    async with _CACHE_LOCK:
        hit = _cache.get(key)
        if hit and now - hit[0] < FORECAST_TTL:
            return hit[1]

    url = (
        f"{OPEN_METEO_BASE}?latitude={latitude}&longitude={longitude}"
        "&forecast_days=7&timezone=auto&daily=temperature_2m_max,temperature_2m_min,"
        "relative_humidity_2m_mean,precipitation_sum,weather_code"
    )
    data = await _fetch(url)
    if not data or "daily" not in data:
        return None

    daily = data["daily"]
    days = daily.get("time") or []
    rows = []
    for i, day in enumerate(days):
        rows.append({
            "day": day,
            "temp_max": daily["temperature_2m_max"][i],
            "temp_min": daily["temperature_2m_min"][i],
            "humidity": daily["relative_humidity_2m_mean"][i],
            "precipitation": daily["precipitation_sum"][i],
            "weather_code": daily["weather_code"][i],
            "condition": derive_condition(
                daily["temperature_2m_max"][i], daily["relative_humidity_2m_mean"][i], 0, daily["weather_code"][i]
            ),
        })

    async with _CACHE_LOCK:
        _cache[key] = (time.time(), rows)
    return rows


async def clear_cache() -> None:
    async with _CACHE_LOCK:
        _cache.clear()