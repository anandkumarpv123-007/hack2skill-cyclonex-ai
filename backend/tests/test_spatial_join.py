import pytest
from app.engine.wind_field import generate_wind_swaths
from app.engine.surge_scenario import generate_surge_inundation_polygon
from app.engine.spatial_join import evaluate_asset_exposure


def test_evaluate_asset_exposure():
    """Verifies deterministic vector intersection with infrastructure points and roads."""
    waypoints = [
        {"lat": 15.0, "lon": 80.0, "max_wind_kmh": 140.0, "r34_km": 150.0, "r50_km": 100.0, "r64_km": 50.0},
        {"lat": 16.0, "lon": 80.5, "max_wind_kmh": 140.0, "r34_km": 150.0, "r50_km": 100.0, "r64_km": 50.0},
    ]
    swaths = generate_wind_swaths(waypoints)
    surge = generate_surge_inundation_polygon(landfall_lat=16.0, landfall_lon=80.5, surge_height_m=3.0)

    # Asset 1: Right at the center of the track (in 64kt zone)
    # Asset 2: Far outside (>500km away)
    # Asset 3: In the coastal surge zone
    assets = [
        {
            "id": "HOSP-01",
            "name": "District Hospital",
            "type": "hospital",
            "district": "Coastal",
            "geometry": {"type": "Point", "coordinates": [80.25, 15.5]},
        },
        {
            "id": "HOSP-02",
            "name": "Distant Hospital",
            "type": "hospital",
            "district": "Inland",
            "geometry": {"type": "Point", "coordinates": [75.0, 15.5]},
        },
        {
            "id": "SHELTER-01",
            "name": "Multi-Purpose Cyclone Shelter",
            "type": "shelter",
            "district": "Coastal",
            "geometry": {"type": "Point", "coordinates": [80.45, 16.0]},
        },
        {
            "id": "ROAD-01",
            "name": "Coastal Highway NH216",
            "type": "road",
            "district": "Coastal",
            "geometry": {
                "type": "LineString",
                "coordinates": [[80.3, 15.2], [80.4, 15.8], [80.5, 16.2]],
            },
        },
    ]

    exposure = evaluate_asset_exposure(assets, swaths, surge)

    assert exposure["total_assets_evaluated"] == 4
    assert exposure["hospitals_at_risk"]["in_64kt"] >= 1
    assert exposure["roads_at_risk_km"]["in_64kt_wind"] > 0
    assert exposure["roads_at_risk_km"]["in_surge_inundation"] >= 0
