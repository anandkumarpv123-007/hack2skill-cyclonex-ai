"""
CYCLONEX Critical Infrastructure API Endpoints
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException
from app.geospatial.osm_loader import osm_provider
from app.engine.shelter_allocator import find_nearest_safe_shelters
from app.providers.live_weather import WeatherProvider
from app.engine.wind_field import generate_wind_swaths
from app.engine.surge_scenario import calculate_scenario_surge_height, generate_surge_inundation_polygon

router = APIRouter()
weather_provider = WeatherProvider()


@router.get("/assets", summary="Get Critical Infrastructure GeoJSON")
async def get_infrastructure_assets(
    asset_type: Optional[str] = Query(None, description="Filter by type: hospital, shelter, substation, road"),
    district: Optional[str] = Query(None, description="Filter by district name"),
):
    """Returns critical infrastructure assets formatted as a GeoJSON FeatureCollection."""
    records = await osm_provider.get_infrastructure_assets(asset_type=asset_type, district=district)
    
    features = [
        {
            "type": "Feature",
            "id": r["id"],
            "geometry": r["geometry"],
            "properties": {
                "id": r["id"],
                "name": r["name"],
                "type": r["type"],
                "district": r["district"],
                **(r.get("properties") or {}),
            },
        }
        for r in records
    ]

    return {
        "type": "FeatureCollection",
        "total_features": len(features),
        "features": features,
    }


@router.get("/shelters/nearby", summary="Find Nearest Safe Cyclone Shelters")
async def get_nearby_shelters(
    lat: float = Query(..., description="Citizen latitude"),
    lon: float = Query(..., description="Citizen longitude"),
    cyclone_id: Optional[str] = Query(None, description="Target cyclone scenario ID"),
    limit: int = Query(4, ge=1, le=10, description="Max shelters to return"),
):
    """
    Computes distance to registered shelters and returns prioritized safe shelters
    with bilingual guidance and compass headings, checking active storm surge and wind hazard clearance.
    """
    if lat < -90.0 or lat > 90.0 or lon < -180.0 or lon > 180.0:
        raise HTTPException(
            status_code=422,
            detail="Invalid coordinates. Latitude must be in [-90, 90] and longitude in [-180, 180]."
        )

    all_shelters = await osm_provider.get_infrastructure_assets(asset_type="shelter")
    
    shelter_list = [
        {
            "id": s["id"],
            "name": s["name"],
            "district": s["district"],
            "lat": s["lat"],
            "lon": s["lon"],
            "capacity": s.get("properties", {}).get("capacity", 500),
            "current_occupancy": s.get("properties", {}).get("current_occupancy", 0),
        }
        for s in all_shelters
        if s.get("lat") and s.get("lon")
    ]

    # Dynamically retrieve active scenario hazard envelopes
    track = None
    if cyclone_id:
        track = await weather_provider.get_benchmark_cyclone(cyclone_id)
    if not track:
        track = await weather_provider.get_active_cyclone()

    surge_poly = None
    wind_64_poly = None
    if track:
        surge_calc = calculate_scenario_surge_height(
            central_pressure_hpa=track.min_pressure_hpa,
            max_wind_speed_kmh=track.peak_wind_kmh,
        )
        surge_inundation = generate_surge_inundation_polygon(
            landfall_lat=track.landfall_lat,
            landfall_lon=track.landfall_lon,
            surge_height_m=surge_calc["total_scenario_surge_m"],
        )
        surge_poly = surge_inundation.get("shapely")

        swaths = generate_wind_swaths([wp.model_dump() for wp in track.waypoints])
        wind_64_poly = swaths.get("swath_64kt", {}).get("shapely")

    safe_shelters = find_nearest_safe_shelters(
        citizen_lat=lat,
        citizen_lon=lon,
        shelters=shelter_list,
        surge_polygon=surge_poly,
        wind_64kt_polygon=wind_64_poly,
        limit=limit,
    )

    return {
        "citizen_coordinates": {"lat": lat, "lon": lon},
        "scenario_applied": track.id if track else "default",
        "total_candidates_evaluated": len(shelter_list),
        "nearest_shelters": safe_shelters,
    }
