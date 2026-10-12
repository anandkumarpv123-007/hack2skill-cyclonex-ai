"""
CYCLONEX Live Weather Endpoint — real-time current conditions for a coastal point.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.providers.live_conditions import fetch_live_conditions

router = APIRouter()


@router.get("/live", summary="Live current weather & sea state at a coastal point (Open-Meteo)")
async def get_live_conditions(
    lat: float = Query(..., description="Latitude in decimal degrees"),
    lon: float = Query(..., description="Longitude in decimal degrees"),
    label: Optional[str] = Query(None, max_length=80, description="Display name for the location"),
):
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        raise HTTPException(status_code=422, detail="Latitude must be in [-90, 90] and longitude in [-180, 180].")
    return await fetch_live_conditions(lat, lon, label)
