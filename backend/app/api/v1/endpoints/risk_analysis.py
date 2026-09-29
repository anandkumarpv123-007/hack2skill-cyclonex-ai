"""
CYCLONEX Deterministic Risk Analysis Endpoint
Integrates the complete deterministic scientific engine: wind swaths, surge simulation,
spatial intersections, and Composite Vulnerability Index calculation.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from app.providers.live_weather import WeatherProvider
from app.geospatial.osm_loader import osm_provider
from app.engine.wind_field import generate_wind_swaths
from app.engine.surge_scenario import calculate_scenario_surge_height, generate_surge_inundation_polygon
from app.engine.spatial_join import evaluate_asset_exposure
from app.engine.cvi_calculator import evaluate_coastal_districts

router = APIRouter()
weather_provider = WeatherProvider()


# Coastal districts metadata baseline for CVI evaluation
COASTAL_DISTRICTS_BASELINE = [
    {
        "name": "Bapatla",
        "max_wind_kmh": 110.0,
        "surge_fraction": 0.35,
        "mean_elevation_m": 4.5,
        "critical_assets_count": 9,
        "shelter_capacity_ratio": 0.65,
    },
    {
        "name": "Prakasam",
        "max_wind_kmh": 95.0,
        "surge_fraction": 0.20,
        "mean_elevation_m": 12.0,
        "critical_assets_count": 6,
        "shelter_capacity_ratio": 0.70,
    },
    {
        "name": "Krishna",
        "max_wind_kmh": 85.0,
        "surge_fraction": 0.25,
        "mean_elevation_m": 4.0,
        "critical_assets_count": 5,
        "shelter_capacity_ratio": 0.60,
    },
    {
        "name": "Nellore",
        "max_wind_kmh": 90.0,
        "surge_fraction": 0.15,
        "mean_elevation_m": 15.0,
        "critical_assets_count": 4,
        "shelter_capacity_ratio": 0.80,
    },
    {
        "name": "Visakhapatnam",
        "max_wind_kmh": 65.0,
        "surge_fraction": 0.05,
        "mean_elevation_m": 14.0,
        "critical_assets_count": 8,
        "shelter_capacity_ratio": 0.85,
    },
]


@router.post("/evaluate", summary="Run Deterministic Risk & Exposure Analysis")
async def evaluate_risk(
    cyclone_id: Optional[str] = Body(None, embed=True, description="Target cyclone ID or active if None"),
):
    """
    Executes end-to-end deterministic geospatial risk calculation:
      1. Generates 34, 50, and 64-kt wind swaths along track.
      2. Simulates coastal surge scenario envelope based on pressure drop and elevation.
      3. Performs vector spatial joins against OSM critical infrastructure.
      4. Calculates Composite Vulnerability Index (CVI) per district.
    """
    if cyclone_id:
        track = await weather_provider.get_benchmark_cyclone(cyclone_id)
        if not track:
            raise HTTPException(status_code=404, detail=f"Cyclone scenario '{cyclone_id}' not found.")
    else:
        track = await weather_provider.get_active_cyclone()

    # 1. Generate Wind Hazard Swaths
    waypoint_dicts = [wp.model_dump() for wp in track.waypoints]
    wind_swaths = generate_wind_swaths(waypoint_dicts)

    # 2. Compute Scenario Surge Height & Inundation Envelope
    surge_calc = calculate_scenario_surge_height(
        central_pressure_hpa=track.min_pressure_hpa,
        max_wind_speed_kmh=track.peak_wind_kmh,
    )
    surge_inundation = generate_surge_inundation_polygon(
        landfall_lat=track.landfall_lat,
        landfall_lon=track.landfall_lon,
        surge_height_m=surge_calc["total_scenario_surge_m"],
    )

    # 3. Spatial Intersections with Critical Assets
    infrastructure_records = await osm_provider.get_infrastructure_assets()
    exposure_summary = evaluate_asset_exposure(
        infrastructure_records=infrastructure_records,
        wind_swaths=wind_swaths,
        surge_scenario=surge_inundation,
    )

    # 4. District Composite Vulnerability Index (CVI)
    # Scale district exposure by storm peak intensity
    intensity_scale = track.peak_wind_kmh / 110.0
    adjusted_districts = [
        {
            **d,
            "max_wind_kmh": round(d["max_wind_kmh"] * intensity_scale, 1),
            "surge_fraction": min(1.0, round(d["surge_fraction"] * intensity_scale, 2)),
        }
        for d in COASTAL_DISTRICTS_BASELINE
    ]
    cvi_rankings = evaluate_coastal_districts(adjusted_districts)

    # Clean GeoJSON structures for transmission
    layers = {
        "track_line": wind_swaths.get("track_geometry"),
        "swath_34kt": wind_swaths["swath_34kt"]["geometry"],
        "swath_50kt": wind_swaths["swath_50kt"]["geometry"],
        "swath_64kt": wind_swaths["swath_64kt"]["geometry"],
        "surge_inundation_zone": surge_inundation["geometry"],
    }

    return {
        "cyclone_metadata": {
            "id": track.id,
            "name": track.name,
            "category": track.category,
            "peak_wind_kmh": track.peak_wind_kmh,
            "min_pressure_hpa": track.min_pressure_hpa,
            "landfall_target": track.landfall_target,
            "is_simulated": track.is_simulated,
            "data_source": track.data_source,
        },
        "surge_scenario": surge_calc,
        "exposure_summary": exposure_summary,
        "cvi_rankings": cvi_rankings,
        "spatial_layers": layers,
    }
