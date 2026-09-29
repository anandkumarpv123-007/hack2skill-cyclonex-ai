"""
CYCLONEX Deterministic Risk Engine
Exports core modules for wind field buffering, storm surge scenario simulation,
infrastructure spatial intersections, CVI computation, and safe shelter routing.
"""

from app.engine.wind_field import generate_wind_swaths
from app.engine.surge_scenario import (
    calculate_scenario_surge_height,
    generate_surge_inundation_polygon,
)
from app.engine.spatial_join import evaluate_asset_exposure
from app.engine.cvi_calculator import calculate_district_cvi, evaluate_coastal_districts
from app.engine.shelter_allocator import (
    haversine_distance,
    find_nearest_safe_shelters,
)

__all__ = [
    "generate_wind_swaths",
    "calculate_scenario_surge_height",
    "generate_surge_inundation_polygon",
    "evaluate_asset_exposure",
    "calculate_district_cvi",
    "evaluate_coastal_districts",
    "haversine_distance",
    "find_nearest_safe_shelters",
]
