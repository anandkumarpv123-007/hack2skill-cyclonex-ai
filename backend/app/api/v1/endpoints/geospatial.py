"""
CYCLONEX Geospatial Endpoint — live Google Earth Engine terrain cross-check (optional).
"""

import asyncio
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from starlette.concurrency import run_in_threadpool

from app.engine.surge_scenario import calculate_scenario_surge_height
from app.geospatial import earth_engine
from app.providers.live_weather import WeatherProvider

router = APIRouter()
weather_provider = WeatherProvider()

EE_TIMEOUT_S = 25.0


@router.get("/terrain-check", summary="Live Earth Engine SRTM terrain check around the landfall point")
async def get_terrain_check(cyclone_id: Optional[str] = Query(None, description="Cyclone ID or active if omitted")):
    track = await weather_provider.get_benchmark_cyclone(cyclone_id) if cyclone_id else await weather_provider.get_active_cyclone()
    if not track:
        raise HTTPException(status_code=404, detail=f"Cyclone scenario '{cyclone_id}' not found.")
    surge_m = calculate_scenario_surge_height(
        central_pressure_hpa=track.min_pressure_hpa, max_wind_speed_kmh=track.peak_wind_kmh
    )["total_scenario_surge_m"]
    try:
        result = await asyncio.wait_for(
            run_in_threadpool(earth_engine.terrain_check, track.landfall_lat, track.landfall_lon, surge_m),
            timeout=EE_TIMEOUT_S,
        )
    except asyncio.TimeoutError:
        result = {"status": "error", "reason": "EARTH_ENGINE_TIMEOUT", "surge_height_m": surge_m}
    return {"cyclone_id": track.id, "landfall_target": track.landfall_target, **result}
