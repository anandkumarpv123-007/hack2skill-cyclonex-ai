import pytest
from fastapi.testclient import TestClient
from app.geospatial.gee_client import gee_client
from app.ai.vertex_gemini import advisory_engine


def test_gee_client_elevation_profile():
    """Verifies coastal elevation client returns grounded elevation metrics and source attribution."""
    bapatla = gee_client.get_coastal_elevation_profile("Bapatla")
    assert "mean_elevation_m" in bapatla
    assert bapatla["mean_elevation_m"] > 0
    assert "source" in bapatla
    assert ("SRTM" in bapatla["source"]) or ("GEE" in bapatla["source"])


def test_grounded_advisory_engine_integrity():
    """
    Verifies that the advisory engine strictly preserves numerical ground truth
    and provides verified Telugu translations.
    """
    mock_ground_truth = {
        "cyclone_metadata": {
            "name": "Cyclone Michaung",
            "category": "Severe Cyclonic Storm",
            "landfall_target": "Bapatla Coast",
            "peak_wind_kmh": 110.0,
            "min_pressure_hpa": 980.0,
        },
        "surge_scenario": {
            "total_scenario_surge_m": 2.85,
        },
        "exposure_summary": {
            "hospitals_at_risk": {"in_64kt": 2, "in_50kt": 4, "in_surge": 1},
            "shelters_at_risk": {"in_64kt": 3, "in_surge": 1},
            "substations_at_risk": {"in_64kt": 2},
            "roads_at_risk_km": {"in_64kt_wind": 45.2, "in_surge_inundation": 18.4},
        },
        "cvi_rankings": [
            {"district": "Bapatla", "cvi_score": 0.82, "risk_level": "Extreme"},
            {"district": "Prakasam", "cvi_score": 0.58, "risk_level": "Moderate"},
        ],
    }

    advisory = advisory_engine.generate_advisory(mock_ground_truth)

    # 1. Grounding Integrity assertions
    assert advisory["grounding_integrity_verified"] is True
    metrics = advisory["metrics_cited"]
    assert metrics["cyclone_name"] == "Cyclone Michaung"
    assert metrics["peak_wind_kmh"] == 110.0
    assert metrics["surge_height_m"] == 2.85
    assert metrics["hospitals_at_risk"] == 2
    assert metrics["roads_inundated_km"] == 18.4
    assert metrics["highest_risk_district"] == "Bapatla"
    assert metrics["highest_cvi_score"] == 0.82

    # 2. Bilingual Verification
    assert "Bapatla" in advisory["authority_guidance_en"]
    assert "110" in advisory["citizen_advisory_en"]
    # Check authentic Telugu Unicode strings
    assert "తుఫాను" in advisory["citizen_advisory_te"]
    assert "సురక్షిత" in advisory["citizen_advisory_te"]
    assert "110" in advisory["citizen_advisory_te"]


def test_advisory_api_endpoint(client: TestClient):
    """Verifies POST /api/v1/advisory/generate endpoint."""
    res = client.post("/api/v1/advisory/generate", json={"cyclone_id": "cyclone_michaung_2023"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "advisory" in data
    assert "authority_guidance_en" in data["advisory"]
    assert "citizen_advisory_te" in data["advisory"]
