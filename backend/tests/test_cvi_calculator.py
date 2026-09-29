import pytest
from app.engine.cvi_calculator import calculate_district_cvi, evaluate_coastal_districts


def test_calculate_district_cvi_bounds():
    """Verifies that CVI score is strictly bounded in [0.0, 1.0]."""
    # Extreme risk district
    extreme = calculate_district_cvi(
        district_name="Bapatla",
        max_wind_kmh=160.0,
        surge_fraction=0.85,
        mean_elevation_m=2.0,
        critical_assets_count=18,
        shelter_capacity_ratio=0.2,
    )
    assert 0.0 <= extreme["cvi_score"] <= 1.0
    assert extreme["risk_level"] in ["High", "Extreme"]

    # Low risk district
    low = calculate_district_cvi(
        district_name="Inland District",
        max_wind_kmh=40.0,
        surge_fraction=0.0,
        mean_elevation_m=45.0,
        critical_assets_count=2,
        shelter_capacity_ratio=0.9,
    )
    assert 0.0 <= low["cvi_score"] <= 1.0
    assert low["risk_level"] in ["Low", "Moderate"]


def test_evaluate_coastal_districts_ordering():
    """Verifies batch evaluation sorts districts by descending risk score."""
    districts = [
        {"name": "District A (Safe)", "max_wind_kmh": 50, "surge_fraction": 0.0, "mean_elevation_m": 40},
        {"name": "District B (Critical)", "max_wind_kmh": 160, "surge_fraction": 0.9, "mean_elevation_m": 1.5},
    ]
    ranked = evaluate_coastal_districts(districts)
    assert len(ranked) == 2
    assert ranked[0]["district"] == "District B (Critical)"
    assert ranked[0]["cvi_score"] > ranked[1]["cvi_score"]
