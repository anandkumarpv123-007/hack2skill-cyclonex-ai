import pytest
from app.engine.wind_field import generate_wind_swaths


def test_wind_swaths_generation():
    """Verifies that wind swaths are correctly generated and hierarchy of radii is preserved."""
    waypoints = [
        {"lat": 14.5, "lon": 82.0, "max_wind_kmh": 120.0, "r34_km": 150.0, "r50_km": 90.0, "r64_km": 45.0},
        {"lat": 15.2, "lon": 81.2, "max_wind_kmh": 140.0, "r34_km": 180.0, "r50_km": 110.0, "r64_km": 60.0},
        {"lat": 15.9, "lon": 80.5, "max_wind_kmh": 110.0, "r34_km": 140.0, "r50_km": 80.0, "r64_km": 30.0},
    ]

    swaths = generate_wind_swaths(waypoints)

    assert swaths["track_geometry"] is not None
    assert swaths["swath_34kt"]["geometry"] is not None
    assert swaths["swath_50kt"]["geometry"] is not None
    assert swaths["swath_64kt"]["geometry"] is not None

    poly_34 = swaths["swath_34kt"]["shapely"]
    poly_50 = swaths["swath_50kt"]["shapely"]
    poly_64 = swaths["swath_64kt"]["shapely"]

    assert poly_34.is_valid
    assert poly_50.is_valid
    assert poly_64.is_valid

    # Mathematical property: 34-kt hazard envelope strictly encompasses 50-kt, which encompasses 64-kt
    assert swaths["swath_34kt"]["area_sq_deg"] > swaths["swath_50kt"]["area_sq_deg"]
    assert swaths["swath_50kt"]["area_sq_deg"] > swaths["swath_64kt"]["area_sq_deg"]


def test_wind_swaths_empty():
    """Verifies empty waypoints produce empty results gracefully."""
    swaths = generate_wind_swaths([])
    assert swaths["swath_34kt"] is None
