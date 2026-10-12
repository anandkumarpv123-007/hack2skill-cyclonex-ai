"""
CYCLONEX Live Current-Conditions Provider (real-time meteorological data)

Fetches the *current* surface weather (and sea state, where available) for a coastal point from
Open-Meteo's public APIs (no API key). These are live model-analysis values for "now", shown
alongside the cyclone scenario, which remains a clearly labelled historical benchmark.

Never raises: on any failure it returns {"status": "unavailable", ...} so the dashboard degrades
gracefully during a demo.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple

import httpx

from app.core.config import settings
from app.core.logging import logger

FORECAST_URL_DEFAULT = "https://api.open-meteo.com/v1/forecast"
MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
CACHE_TTL_S = 600          # Open-Meteo current values update every ~15 minutes
REQUEST_TIMEOUT_S = 5.0
CYCLONIC_WIND_THRESHOLD_KMH = 62.0   # IMD "cyclonic storm" lower bound (34 kt)

CURRENT_FIELDS = (
    "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,"
    "wind_gusts_10m,wind_direction_10m,surface_pressure,weather_code"
)

_cache: Dict[Tuple[float, float], Tuple[float, Dict[str, Any]]] = {}


async def _get_json(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()


def _num(v: Any) -> Optional[float]:
    try:
        f = float(v)
        return f if f == f else None  # drop NaN
    except (TypeError, ValueError):
        return None


async def fetch_live_conditions(lat: float, lon: float, label: Optional[str] = None) -> Dict[str, Any]:
    key = (round(lat, 2), round(lon, 2))
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < CACHE_TTL_S:
        return {**hit[1], "served_from_cache": True, "location": {**hit[1]["location"], "label": label or hit[1]["location"].get("label")}}

    base = {
        "location": {"lat": key[0], "lon": key[1], "label": label},
        "source": "Open-Meteo (api.open-meteo.com) — live model analysis, no API key",
        "note": "Live conditions for the current moment. The cyclone scenario on this dashboard is a historical benchmark.",
    }

    if not settings.LIVE_CONDITIONS_ENABLED:
        return {**base, "status": "unavailable", "reason": "LIVE_CONDITIONS_DISABLED"}

    url = settings.OPEN_METEO_API_URL or FORECAST_URL_DEFAULT
    try:
        data = await _get_json(url, {
            "latitude": key[0], "longitude": key[1], "current": CURRENT_FIELDS,
            "wind_speed_unit": "kmh", "timezone": "Asia/Kolkata",
        })
        cur = data.get("current") or {}
        if not cur:
            raise ValueError("no 'current' block in response")
    except Exception as e:
        logger.warning(f"Live conditions unavailable ({type(e).__name__}).")
        return {**base, "status": "unavailable", "reason": type(e).__name__}

    wind = _num(cur.get("wind_speed_10m"))
    conditions = {
        "temperature_c": _num(cur.get("temperature_2m")),
        "relative_humidity_pct": _num(cur.get("relative_humidity_2m")),
        "precipitation_mm": _num(cur.get("precipitation")),
        "wind_speed_kmh": wind,
        "wind_gusts_kmh": _num(cur.get("wind_gusts_10m")),
        "wind_direction_deg": _num(cur.get("wind_direction_10m")),
        "surface_pressure_hpa": _num(cur.get("surface_pressure")),
        "weather_code": cur.get("weather_code"),
        "wave_height_m": None,
    }

    # Sea state is optional: a failure here must not hide the surface observations.
    try:
        marine = await _get_json(MARINE_URL, {
            "latitude": key[0], "longitude": key[1], "current": "wave_height", "timezone": "Asia/Kolkata",
        })
        conditions["wave_height_m"] = _num((marine.get("current") or {}).get("wave_height"))
    except Exception:
        pass

    result = {
        **base,
        "status": "live",
        "observed_at": cur.get("time"),
        "timezone": data.get("timezone", "Asia/Kolkata"),
        "conditions": conditions,
        "cyclonic_wind_threshold_kmh": CYCLONIC_WIND_THRESHOLD_KMH,
        "cyclonic_winds_now": bool(wind is not None and wind >= CYCLONIC_WIND_THRESHOLD_KMH),
        "served_from_cache": False,
    }
    _cache[key] = (now, result)
    return result
