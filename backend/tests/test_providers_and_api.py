import pytest
from fastapi.testclient import TestClient
from app.providers.simulated_benchmarks import get_benchmark, list_benchmarks
from app.geospatial.osm_loader import osm_provider


def test_benchmarks_registry():
    """Verifies that historical benchmarks (Michaung & Hudhud) are properly configured."""
    benchmarks = list_benchmarks()
    assert len(benchmarks) >= 2
    ids = [b["id"] for b in benchmarks]
    assert "cyclone_michaung_2023" in ids
    assert "cyclone_hudhud_2014" in ids

    michaung = get_benchmark("cyclone_michaung_2023")
    assert michaung is not None
    assert michaung.is_simulated is True
    assert len(michaung.waypoints) >= 5
    assert michaung.peak_wind_kmh == 110.0


@pytest.mark.anyio
async def test_osm_loader():
    """Verifies OSM infrastructure records and vector geometries."""
    hospitals = await osm_provider.get_infrastructure_assets(asset_type="hospital")
    assert len(hospitals) >= 4
    for h in hospitals:
        assert h["geometry"]["type"] == "Point"
        assert h["district"] in ["Bapatla", "Prakasam", "Krishna", "Nellore", "Visakhapatnam"]

    roads = await osm_provider.get_infrastructure_assets(asset_type="road")
    assert len(roads) >= 1
    assert roads[0]["geometry"]["type"] == "LineString"


def test_cyclone_api_endpoints(client: TestClient):
    """Verifies /api/v1/cyclone endpoints."""
    # List benchmarks
    res = client.get("/api/v1/cyclone/benchmarks")
    assert res.status_code == 200
    assert len(res.json()) >= 2

    # Get active
    res_active = client.get("/api/v1/cyclone/active")
    assert res_active.status_code == 200
    assert "waypoints" in res_active.json()

    # Get specific scenario
    res_michaung = client.get("/api/v1/cyclone/cyclone_michaung_2023")
    assert res_michaung.status_code == 200
    assert res_michaung.json()["name"] == "Cyclone Michaung"


def test_infrastructure_api_endpoints(client: TestClient):
    """Verifies /api/v1/infrastructure endpoints."""
    # Query GeoJSON assets
    res = client.get("/api/v1/infrastructure/assets?asset_type=hospital")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert data["total_features"] >= 4

    # Query nearest safe shelters
    res_shelters = client.get("/api/v1/infrastructure/shelters/nearby?lat=15.82&lon=80.48&limit=2")
    assert res_shelters.status_code == 200
    shelter_data = res_shelters.json()
    assert "nearest_shelters" in shelter_data
    assert len(shelter_data["nearest_shelters"]) <= 2
    for s in shelter_data["nearest_shelters"]:
        assert "distance_km" in s
        assert "safety_status_te" in s


def test_risk_evaluate_endpoint(client: TestClient):
    """Verifies end-to-end /api/v1/risk/evaluate pipeline."""
    payload = {"cyclone_id": "cyclone_michaung_2023"}
    res = client.post("/api/v1/risk/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Verify deterministic output structure
    assert "cyclone_metadata" in data
    assert "surge_scenario" in data
    assert "exposure_summary" in data
    assert "cvi_rankings" in data
    assert "spatial_layers" in data

    # Verify spatial layers are GeoJSON
    layers = data["spatial_layers"]
    assert layers["swath_34kt"]["type"] in ["Polygon", "MultiPolygon"]
    assert layers["surge_inundation_zone"]["type"] in ["Polygon", "MultiPolygon"]

    # Verify exposure metrics are exact integers
    exposure = data["exposure_summary"]
    assert isinstance(exposure["hospitals_at_risk"]["in_64kt"], int)
    assert isinstance(exposure["roads_at_risk_km"]["in_64kt_wind"], float)
