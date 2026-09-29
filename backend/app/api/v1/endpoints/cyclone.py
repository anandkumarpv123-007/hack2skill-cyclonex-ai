"""
CYCLONEX Cyclone Track API Endpoints
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.providers.live_weather import WeatherProvider
from app.providers.base import CycloneTrack

router = APIRouter()
weather_provider = WeatherProvider()


@router.get("/active", response_model=CycloneTrack, summary="Get Active or Default Cyclone Track")
async def get_active_cyclone():
    """
    Returns the currently active cyclone or the default verified historical benchmark
    with explicit data source labeling.
    """
    return await weather_provider.get_active_cyclone()


@router.get("/benchmarks", response_model=List[Dict[str, Any]], summary="List Verified Historical Benchmarks")
async def list_benchmarks():
    """Returns available historical benchmark scenarios (Michaung, Hudhud)."""
    return await weather_provider.list_available_benchmarks()


@router.get("/{cyclone_id}", response_model=CycloneTrack, summary="Get Specific Cyclone Scenario")
async def get_cyclone_by_id(cyclone_id: str):
    """Retrieves full waypoints and meteorological metadata for a specific scenario."""
    track = await weather_provider.get_benchmark_cyclone(cyclone_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Cyclone scenario '{cyclone_id}' not found.")
    return track
