import pytest
from app.engine.surge_scenario import calculate_scenario_surge_height, generate_surge_inundation_polygon


def test_scenario_surge_height_calculation():
    """Verifies inverted barometer effect and wind setup formulas."""
    # Test Severe Cyclone (e.g. 960 hPa, 150 km/h)
    res = calculate_scenario_surge_height(central_pressure_hpa=960.0, max_wind_speed_kmh=150.0)

    # Inverted barometer: 0.01 * (1013.25 - 960) = 0.53m
    assert res["delta_h_pressure_m"] == 0.53
    assert res["delta_h_wind_m"] > 1.0
    assert res["total_scenario_surge_m"] > 2.0
    assert res["is_hydrodynamic_forecast"] is False
    assert "scenario simulation" in res["disclaimer"].lower()


def test_surge_inundation_polygon_generation():
    """Verifies coastal inundation polygon geometry is valid and non-empty."""
    poly_data = generate_surge_inundation_polygon(
        landfall_lat=15.9,
        landfall_lon=80.5,
        surge_height_m=3.2,
        coastal_span_km=50.0,
    )

    assert poly_data["geometry"] is not None
    assert poly_data["shapely"].is_valid
    assert poly_data["area_sq_deg"] > 0
    assert poly_data["inland_reach_km"] > 0
