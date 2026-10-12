"""
CYCLONEX Google Earth Engine terrain check (optional, live when credentials are configured).

Runs a real Earth Engine computation on the SRTM 30 m DEM (USGS/SRTMGL1_003) around the scenario
landfall point: mean land elevation and the share / area of land lying below the scenario surge
height. It is reported as an independent satellite-terrain cross-check and does NOT feed the CVI
(the CVI keeps its documented benchmark inputs).

Configuration (Railway backend variables):
  GEE_PROJECT_ID           Google Cloud project registered for Earth Engine
  GEE_SERVICE_ACCOUNT_JSON full JSON key of a service account with Earth Engine access
                           (alternatively GEE_SERVICE_ACCOUNT_KEY_PATH = path to the key file)
Without these, status is "not_configured" and nothing else changes.
"""

from __future__ import annotations

import json
import math
import threading
import time
from typing import Any, Dict, Optional, Tuple

from app.core.config import settings
from app.core.logging import logger

DATASET = "USGS/SRTMGL1_003"
SCALE_M = 90            # analysis scale; 30 m native, 90 m keeps the request fast
DEFAULT_RADIUS_KM = 15.0
CACHE_TTL_S = 3600

_lock = threading.Lock()
_state: Dict[str, Any] = {"initialized": False, "attempted": False, "error": None}
_cache: Dict[Tuple[float, float, float, float], Tuple[float, Dict[str, Any]]] = {}


def _credentials_available() -> bool:
    return bool(settings.GEE_PROJECT_ID and (settings.GEE_SERVICE_ACCOUNT_JSON or settings.GEE_SERVICE_ACCOUNT_KEY_PATH))


def initialize() -> bool:
    """Initializes Earth Engine once. Returns True if ready. Never raises."""
    with _lock:
        if _state["initialized"]:
            return True
        if _state["attempted"]:
            return False
        _state["attempted"] = True
        if not _credentials_available():
            _state["error"] = "NOT_CONFIGURED"
            return False
        try:
            import ee

            if settings.GEE_SERVICE_ACCOUNT_JSON:
                key_data = settings.GEE_SERVICE_ACCOUNT_JSON
                email = json.loads(key_data)["client_email"]
                creds = ee.ServiceAccountCredentials(email, key_data=key_data)
            else:
                with open(settings.GEE_SERVICE_ACCOUNT_KEY_PATH, "r", encoding="utf-8") as fh:
                    email = json.load(fh)["client_email"]
                creds = ee.ServiceAccountCredentials(email, key_file=settings.GEE_SERVICE_ACCOUNT_KEY_PATH)
            ee.Initialize(credentials=creds, project=settings.GEE_PROJECT_ID)
            _state["initialized"] = True
            _state["error"] = None
            logger.info("Google Earth Engine initialized (service account).")
            return True
        except Exception as e:
            _state["error"] = type(e).__name__
            logger.warning(f"Earth Engine initialization failed ({type(e).__name__}).")
            return False


def is_live() -> bool:
    return bool(_state["initialized"])


def status_summary() -> Dict[str, Any]:
    return {
        "configured": _credentials_available(),
        "initialized": bool(_state["initialized"]),
        "error": _state["error"],
    }


def _compute(lat: float, lon: float, surge_m: float, radius_km: float) -> Dict[str, Any]:
    import ee

    region = ee.Geometry.Point([lon, lat]).buffer(radius_km * 1000)
    dem = ee.Image(DATASET).select("elevation")
    land = dem.gt(0)
    below = dem.lt(surge_m).And(land)
    stack = ee.Image.cat([
        dem.updateMask(land).rename("land_elev"),
        land.rename("land"),
        below.rename("below"),
    ])
    stats = stack.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=region, scale=SCALE_M, maxPixels=int(1e8), bestEffort=True
    ).getInfo() or {}

    land_share = stats.get("land")
    below_share = stats.get("below")
    mean_elev = stats.get("land_elev")
    circle_km2 = math.pi * radius_km ** 2
    frac_land_below = (below_share / land_share) if land_share else None
    return {
        "mean_land_elevation_m": round(mean_elev, 1) if mean_elev is not None else None,
        "land_fraction_below_surge_pct": round(100 * frac_land_below, 1) if frac_land_below is not None else None,
        "land_area_below_surge_km2": round(below_share * circle_km2, 1) if below_share is not None else None,
        "land_area_analysed_km2": round(land_share * circle_km2, 1) if land_share is not None else None,
    }


def terrain_check(lat: float, lon: float, surge_m: float, radius_km: float = DEFAULT_RADIUS_KM) -> Dict[str, Any]:
    """Blocking call (run it in a worker thread). Never raises."""
    base = {
        "source": f"Google Earth Engine · {DATASET} (SRTM 30 m DEM)",
        "location": {"lat": round(lat, 3), "lon": round(lon, 3)},
        "radius_km": radius_km,
        "surge_height_m": surge_m,
        "note": "Independent satellite-terrain cross-check computed live in Earth Engine; it does not change the CVI.",
    }
    if not initialize():
        return {**base, "status": "not_configured" if _state["error"] == "NOT_CONFIGURED" else "error",
                "reason": _state["error"]}

    key = (round(lat, 3), round(lon, 3), round(surge_m, 2), radius_km)
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL_S:
        return {**hit[1], "served_from_cache": True}
    try:
        result = {**base, "status": "live", **_compute(lat, lon, surge_m, radius_km),
                  "computed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "served_from_cache": False}
    except Exception as e:
        logger.warning(f"Earth Engine terrain check failed ({type(e).__name__}).")
        return {**base, "status": "error", "reason": type(e).__name__}
    _cache[key] = (time.time(), result)
    return result
