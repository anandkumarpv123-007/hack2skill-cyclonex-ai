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
from shapely.geometry import Point, Polygon, LineString, mapping, box
from shapely.ops import unary_union
from app.geospatial.coastline import AP_COASTLINE, KM_PER_DEGREE


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

    MODELING HEURISTIC DISCLOSURE:
    Inland penetration reach (surge_height_m / 0.35) is an uncalibrated geometric
    planar slope screening heuristic (assuming a uniform 0.35 m/km coastal rise for
    pre-landfall screening). It is NOT an engineering-grade hydrodynamic flood boundary
    or validated ground truth.
    """
    # Simplified planar coastal slope heuristic for screening (0.35 m rise per km)
    slope_m_per_km = 0.35
    if inland_reach_km is None:
        inland_reach_km = min(25.0, max(2.0, surge_height_m / slope_m_per_km))

    # Metric to degree conversion (~111 km/deg lat)
    deg_lat_span = (coastal_span_km / 2.0) / KM_PER_DEGREE
    deg_reach = inland_reach_km / KM_PER_DEGREE
    lat_band = box(-180.0, landfall_lat - deg_lat_span, 180.0, landfall_lat + deg_lat_span)

    # Envelope follows the actual coastline: every point within the inland reach of the
    # coast segment inside the coastal band around landfall. (The coast is not north-south
    # everywhere, e.g. Visakhapatnam runs south-west to north-east.)
    coast_segment = AP_COASTLINE.intersection(lat_band)
    if not coast_segment.is_empty:
        inundation_poly = coast_segment.buffer(deg_reach).intersection(lat_band)
    else:
        # Landfall outside the modeled AP coastline: fall back to a band west of landfall.
        deg_lon_reach = inland_reach_km / (KM_PER_DEGREE * np.cos(np.radians(landfall_lat)))
        inundation_poly = Polygon([
            (landfall_lon, landfall_lat + deg_lat_span),
            (landfall_lon, landfall_lat - deg_lat_span),
            (landfall_lon - deg_lon_reach, landfall_lat - deg_lat_span),
            (landfall_lon - deg_lon_reach, landfall_lat + deg_lat_span),
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
