"""
CYCLONEX Scenario-Based Storm Surge Simulation Engine
Simulates pre-landfall coastal inundation scenarios by combining central barometric
pressure drop (inverted barometer effect), onshore wind stress setup, and coastal digital
elevation thresholds (SRTM/DEM).

IMPORTANT SCIENTIFIC MODELING DISCLOSURE:
This module performs an explainable pre-landfall terrain and elevation scenario simulation.
It is explicitly NOT a calibrated numerical hydrodynamic wave-action PDE solver (such as SLOSH or ADCIRC).
"""

from typing import Dict, Any, Optional
import numpy as np
from shapely.geometry import Point, Polygon, LineString, mapping
from shapely.ops import unary_union


STANDARD_PRESSURE_HPA = 1013.25


def calculate_scenario_surge_height(
    central_pressure_hpa: float,
    max_wind_speed_kmh: float,
    tide_baseline_m: float = 0.5,
    shelf_slope_factor: float = 1.15,
) -> Dict[str, Any]:
    """
    Computes deterministic scenario surge elevation (in meters) based on
    inverted barometer effect and parametric onshore wind setup.

    Formulas:
      Delta_h_pressure = max(0.0, 0.01 * (1013.25 - P_central))
      Delta_h_wind = shelf_slope_factor * (max_wind_speed_kmh / 100.0) ** 1.8
      Total Scenario Surge = Delta_h_pressure + Delta_h_wind + Tide_baseline
    """
    # 1. Inverted Barometer Effect (~1 cm water rise per 1 hPa pressure drop)
    pressure_drop = max(0.0, STANDARD_PRESSURE_HPA - central_pressure_hpa)
    delta_h_pressure = round(0.01 * pressure_drop, 2)

    # 2. Wind Setup over shallow coastal shelf
    wind_ratio = max(0.0, max_wind_speed_kmh / 100.0)
    delta_h_wind = round(shelf_slope_factor * (wind_ratio ** 1.8), 2)

    # 3. Total Scenario Inundation Height
    total_surge_scenario_m = round(delta_h_pressure + delta_h_wind + tide_baseline_m, 2)

    return {
        "model_type": "terrain_elevation_scenario_simulation",
        "is_hydrodynamic_forecast": False,
        "disclaimer": (
            "Scenario simulation based on coastal elevation threshold and pressure drop; "
            "not a hydrodynamic PDE wave-action solver."
        ),
        "central_pressure_hpa": central_pressure_hpa,
        "max_wind_speed_kmh": max_wind_speed_kmh,
        "delta_h_pressure_m": delta_h_pressure,
        "delta_h_wind_m": delta_h_wind,
        "tide_baseline_m": tide_baseline_m,
        "total_scenario_surge_m": total_surge_scenario_m,
    }


def generate_surge_inundation_polygon(
    landfall_lat: float,
    landfall_lon: float,
    surge_height_m: float,
    coastal_span_km: float = 60.0,
    inland_reach_km: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Constructs a deterministic coastal inundation scenario polygon envelope
    along the vulnerable coastal interface around the projected landfall coordinates.

    Inland penetration extent is determined by scenario surge height and coastal slope:
      Inland Reach (km) = Surge Height (m) / Coastal Slope (~0.0003 for Bay of Bengal deltas)
    """
    # Default coastal slope for Krishna-Godavari coastal plain ~ 0.35m rise per km
    slope_m_per_km = 0.35
    if inland_reach_km is None:
        inland_reach_km = min(25.0, max(2.0, surge_height_m / slope_m_per_km))

    # Metric to degree conversion (~111 km/deg lat)
    deg_lat_span = (coastal_span_km / 2.0) / 111.0
    deg_lon_reach = inland_reach_km / (111.0 * np.cos(np.radians(landfall_lat)))

    # In Bay of Bengal (East Coast of India), the coast faces East; inland is to the West (decreasing lon)
    p_north_coast = (landfall_lon, landfall_lat + deg_lat_span)
    p_south_coast = (landfall_lon, landfall_lat - deg_lat_span)
    p_south_inland = (landfall_lon - deg_lon_reach, landfall_lat - deg_lat_span)
    p_north_inland = (landfall_lon - deg_lon_reach, landfall_lat + deg_lat_span)

    inundation_poly = Polygon([
        p_north_coast,
        p_south_coast,
        p_south_inland,
        p_north_inland,
        p_north_coast,
    ])

    return {
        "model_type": "terrain_elevation_scenario_simulation",
        "is_hydrodynamic_forecast": False,
        "surge_height_m": surge_height_m,
        "inland_reach_km": round(inland_reach_km, 2),
        "coastal_span_km": coastal_span_km,
        "geometry": mapping(inundation_poly),
        "shapely": inundation_poly,
        "area_sq_deg": inundation_poly.area,
    }
