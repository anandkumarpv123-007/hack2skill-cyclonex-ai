import pytest
from shapely.geometry import Point, Polygon
from app.engine.shelter_allocator import haversine_distance, find_nearest_safe_shelters


def test_haversine_distance():
    """Verifies Haversine distance accuracy."""
    # Distance between Visakhapatnam (17.6868, 83.2185) and Kakinada (16.9891, 82.2475) ~ 130 km
    dist = haversine_distance(17.6868, 83.2185, 16.9891, 82.2475)
    assert 120.0 < dist < 140.0


def test_find_nearest_safe_shelters():
    """Verifies safe shelters are prioritized over inundated ones."""
    # Create an inundated zone around (80.1, 15.1)
    surge_poly = Polygon([[80.0, 15.0], [80.2, 15.0], [80.2, 15.2], [80.0, 15.2]])

    shelters = [
        {"id": "S1", "name": "Flooded Shelter", "lat": 15.1, "lon": 80.1, "capacity": 500, "current_occupancy": 100},
        {"id": "S2", "name": "Safe Elevated Shelter", "lat": 15.3, "lon": 80.3, "capacity": 800, "current_occupancy": 200},
    ]

    citizen_lat = 15.05
    citizen_lon = 80.05

    nearest = find_nearest_safe_shelters(citizen_lat, citizen_lon, shelters, surge_polygon=surge_poly)

    assert len(nearest) == 2
    # Even though S1 is closer to the citizen, S2 must be prioritized because S1 is compromised by surge
    assert nearest[0]["id"] == "S2"
    assert nearest[0]["is_safe"] is True
    assert nearest[1]["id"] == "S1"
    assert nearest[1]["is_safe"] is False
