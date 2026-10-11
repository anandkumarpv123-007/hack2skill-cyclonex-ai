import pytest
from fastapi.testclient import TestClient
from app.geospatial.gee_client import gee_client
from app.ai.vertex_gemini import advisory_engine, verify_numerical_grounding, get_grounding_status


def test_gee_client_elevation_profile():
    """Verifies coastal elevation client returns grounded elevation metrics and source attribution."""
    bapatla = gee_client.get_coastal_elevation_profile("Bapatla")
    assert "mean_elevation_m" in bapatla
    assert bapatla["mean_elevation_m"] > 0
    assert "source" in bapatla
    assert ("BENCHMARK" in bapatla["source"]) or ("SRTM" in bapatla["source"])
    assert bapatla["is_live_gee"] is False


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
            {"district": "Bapatla", "cvi_score": 0.82, "risk_level": "Extreme", "action_code": "IMMEDIATE_MANDATORY_EVACUATION"},
            {"district": "Prakasam", "cvi_score": 0.58, "risk_level": "High", "action_code": "PREPARE_SHELTERS_EVACUATE_VULNERABLE"},
        ],
    }

    advisory = advisory_engine.generate_advisory(mock_ground_truth)

    # 1. Grounding Integrity assertions
    assert advisory["grounding_integrity_verified"] is True
    metrics = advisory["metrics_cited"]
    assert metrics["cyclone_name"] == "Cyclone Michaung"
    assert metrics["peak_wind_kmh"] == 110.0
    assert metrics["central_pressure_hpa"] == 980.0
    assert metrics["surge_height_m"] == 2.85
    assert metrics["scenario_surge_m"] == 2.85
    assert metrics["hospitals_at_risk"] == 2
    assert metrics["roads_inundated_km"] == 18.4
    assert metrics["highest_risk_district"] == "Bapatla"
    assert metrics["highest_cvi_score"] == 0.82
    assert metrics["district_risk_level"] == "Extreme"

    # 2. Consistent action directive
    assert "IMMEDIATE MANDATORY COASTAL EVACUATION" in advisory["authority_guidance_en"]

    # 3. Bilingual Verification
    assert "Bapatla" in advisory["authority_guidance_en"]
    assert "110" in advisory["citizen_advisory_en"]
    # Check authentic Telugu Unicode strings
    assert "తుఫాను" in advisory["citizen_advisory_te"]
    assert "సురక్షిత" in advisory["citizen_advisory_te"]
    assert "110" in advisory["citizen_advisory_te"]


def test_advisory_missing_inputs_validation():
    """Verifies that generate_advisory rejects missing/incomplete required inputs rather than inventing defaults."""
    # 1. Empty dict
    with pytest.raises(ValueError, match="Invalid ground truth data: input must be a non-empty dictionary."):
        advisory_engine.generate_advisory({})

    # 2. Missing metadata
    with pytest.raises(ValueError, match="Missing required ground truth input: 'cyclone_metadata'"):
        advisory_engine.generate_advisory({"cvi_rankings": [{"district": "Bapatla", "cvi_score": 0.8, "risk_level": "Extreme"}]})

    # 3. Incomplete metadata (missing peak_wind_kmh)
    with pytest.raises(ValueError, match="Incomplete 'cyclone_metadata'"):
        advisory_engine.generate_advisory({
            "cyclone_metadata": {"name": "Test", "min_pressure_hpa": 980, "landfall_target": "Coast"},
            "surge_scenario": {"total_scenario_surge_m": 2.0},
            "cvi_rankings": [{"district": "Bapatla", "cvi_score": 0.8, "risk_level": "Extreme"}],
        })

    # 4. Missing cvi_rankings
    with pytest.raises(ValueError, match="Missing required ground truth input: 'cvi_rankings'"):
        advisory_engine.generate_advisory({
            "cyclone_metadata": {"name": "Test", "peak_wind_kmh": 100, "min_pressure_hpa": 980, "landfall_target": "Coast"},
            "surge_scenario": {"total_scenario_surge_m": 2.0},
            "cvi_rankings": [],
        })


def test_advisory_cvi_action_consistency():
    """
    Verifies that the advisory directive strictly agrees with CVI risk level
    and action code across all 4 severity levels (Extreme, High, Moderate, Low).
    """
    levels_and_expected = [
        ("Extreme", "IMMEDIATE_MANDATORY_EVACUATION", 0.75, "IMMEDIATE MANDATORY COASTAL EVACUATION"),
        ("High", "PREPARE_SHELTERS_EVACUATE_VULNERABLE", 0.55, "PREPARE SHELTERS AND EVACUATE VULNERABLE POPULATIONS"),
        ("Moderate", "RESTRICT_MOVEMENT_SECURE_ASSETS", 0.35, "RESTRICT NON-ESSENTIAL MOVEMENT AND SECURE CRITICAL ASSETS"),
        ("Low", "MONITOR_UPDATES", 0.20, "MONITOR INCIDENT BULLETINS AND MAINTAIN WATCH"),
    ]

    for r_level, a_code, score, expected_phrase in levels_and_expected:
        gt = {
            "cyclone_metadata": {"name": "Test", "peak_wind_kmh": 90, "min_pressure_hpa": 990, "landfall_target": "AP"},
            "surge_scenario": {"total_scenario_surge_m": 1.5},
            "cvi_rankings": [{"district": "TestDistrict", "cvi_score": score, "risk_level": r_level, "action_code": a_code}],
        }
        adv = advisory_engine.generate_advisory(gt)
        assert expected_phrase in adv["authority_guidance_en"], (
            f"Expected '{expected_phrase}' in authority guidance for {r_level} risk, but got: {adv['authority_guidance_en']}"
        )


def test_advisory_target_district_selection():
    """Verifies that requesting a specific target district focuses the advisory on that district."""
    gt = {
        "cyclone_metadata": {"name": "Test", "peak_wind_kmh": 120, "min_pressure_hpa": 975, "landfall_target": "AP Coast"},
        "surge_scenario": {"total_scenario_surge_m": 2.2},
        "cvi_rankings": [
            {"district": "Bapatla", "cvi_score": 0.85, "risk_level": "Extreme", "action_code": "IMMEDIATE_MANDATORY_EVACUATION"},
            {"district": "Prakasam", "cvi_score": 0.45, "risk_level": "Moderate", "action_code": "RESTRICT_MOVEMENT_SECURE_ASSETS"},
        ],
    }

    # Focus on Prakasam (which is Moderate risk), even though Bapatla is top (Extreme)
    adv_prakasam = advisory_engine.generate_advisory(gt, target_district="Prakasam")
    assert adv_prakasam["metrics_cited"]["highest_risk_district"] == "Prakasam"
    assert adv_prakasam["metrics_cited"]["district_risk_level"] == "Moderate"
    assert "RESTRICT NON-ESSENTIAL MOVEMENT" in adv_prakasam["authority_guidance_en"]
    assert "Prakasam" in adv_prakasam["authority_guidance_en"]

    # Requesting non-existent district raises ValueError
    with pytest.raises(ValueError, match="not found in CVI rankings"):
        advisory_engine.generate_advisory(gt, target_district="NonExistentDistrict")


def test_advisory_api_endpoint(client: TestClient):
    """Verifies POST /api/v1/advisory/generate endpoint."""
    res = client.post("/api/v1/advisory/generate", json={"cyclone_id": "cyclone_michaung_2023"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "advisory" in data
    assert "authority_guidance_en" in data["advisory"]
    assert "citizen_advisory_te" in data["advisory"]


def test_verify_numerical_grounding_edge_cases():
    """
    Verifies that numerical grounding verifier handles exact numeric tokens,
    rejects larger-number false positives, supports decimal formatting and attached units,
    and safely rejects missing metrics, empty output, and non-finite inputs.
    """
    import math

    # 1. Exact numeric matches (standard spacing and units)
    valid_text = "Peak wind 110 km/h with surge of 2.85 m expected."
    assert verify_numerical_grounding(valid_text, 110.0, 2.85) is True
    assert get_grounding_status(valid_text, 110.0, 2.85, is_live_ai=True) == "VERIFIED_NUMERICAL_MATCH"
    assert get_grounding_status(valid_text, 110.0, 2.85, is_live_ai=False) == "DETERMINISTIC_GROUNDED_VERIFIED"

    # Decimal wind match (110.0)
    assert verify_numerical_grounding("Peak wind 110.0 km/h with surge of 2.85 m expected.", 110.0, 2.85) is True

    # 2. Larger-number false positives MUST NOT match
    # 110 must NOT match 1100, 1104, 2110
    assert verify_numerical_grounding("Peak wind 1100 km/h with surge of 2.85 m expected.", 110.0, 2.85) is False
    assert verify_numerical_grounding("Highway 1104 closed with surge of 2.85 m expected.", 110.0, 2.85) is False
    assert verify_numerical_grounding("District 2110 sustained surge of 2.85 m.", 110.0, 2.85) is False
    # 2.85 must NOT match 12.85 or 2.855
    assert verify_numerical_grounding("Peak wind 110 km/h with surge of 12.85 m expected.", 110.0, 2.85) is False
    assert verify_numerical_grounding("Peak wind 110 km/h with surge of 2.855 m expected.", 110.0, 2.85) is False
    # Unrelated decimal mismatch (110.5 km/h when target is 110.0)
    assert verify_numerical_grounding("Peak wind 110.5 km/h with surge of 2.85 m expected.", 110.0, 2.85) is False

    # 3. Attached units, decimal formatting, punctuation, and whitespace
    assert verify_numerical_grounding("Speed 110km/h and 2.85m surge.", 110.0, 2.85) is True
    assert verify_numerical_grounding("Conditions: 110-km/h winds, (2.85m) coastal surge.", 110.0, 2.85) is True
    assert verify_numerical_grounding("Peak wind: 110. Coastal surge: 2.85.", 110.0, 2.85) is True
    assert verify_numerical_grounding("Winds: 110, surge: 2.850m.", 110.0, 2.85) is True
    assert verify_numerical_grounding("Winds 110 km/h with rounded surge 2.9 m.", 110.0, 2.85) is True

    # Telugu unicode with units
    assert verify_numerical_grounding("గంటకు 110 కి.మీ తీవ్ర గాలులు మరియు 2.85 మీటర్ల సముద్ర అలల ముంపు", 110.0, 2.85) is True

    # 4. Missing metrics in text
    missing_text = "Severe cyclone approaching the coast."
    assert verify_numerical_grounding(missing_text, 110.0, 2.85) is False
    assert get_grounding_status(missing_text, 110.0, 2.85, is_live_ai=True) == "SOURCE_CONTEXT_SUPPLIED_UNVERIFIED_NUMERICS"
    assert get_grounding_status(missing_text, 110.0, 2.85, is_live_ai=False) == "DETERMINISTIC_RULE_TEMPLATE"
    # Only wind present
    assert verify_numerical_grounding("Winds reached 110 km/h with severe storm impacts.", 110.0, 2.85) is False
    # Only surge present
    assert verify_numerical_grounding("Storm surge measured at 2.85 meters along coast.", 110.0, 2.85) is False

    # 5. Non-finite or invalid inputs
    for bad in [math.nan, math.inf, -math.inf, None, True, False, "110"]:
        assert verify_numerical_grounding(valid_text, bad, 2.85) is False
        assert verify_numerical_grounding(valid_text, 110.0, bad) is False

    # 6. Empty, whitespace-only, or non-string text
    assert verify_numerical_grounding("", 110.0, 2.85) is False
    assert verify_numerical_grounding("   ", 110.0, 2.85) is False
    assert verify_numerical_grounding(None, 110.0, 2.85) is False
    assert verify_numerical_grounding(12345, 110.0, 2.85) is False

    # 7. Swapped metric values MUST BE REJECTED
    # Wind 2.85 km/h, surge 110 m when expecting wind 110.0 and surge 2.85
    assert verify_numerical_grounding("Peak wind 2.85 km/h with surge of 110 m expected.", 110.0, 2.85) is False
    assert verify_numerical_grounding("Dangerous winds up to 2.85 km/h and sea surge up to 110m expected.", 110.0, 2.85) is False
    assert verify_numerical_grounding("Speed 2.85km/h and 110m surge.", 110.0, 2.85) is False
    assert verify_numerical_grounding("Peak wind: 2.85. Coastal surge: 110.", 110.0, 2.85) is False
    assert verify_numerical_grounding("Winds: 2.85, surge: 110m.", 110.0, 2.85) is False
    assert verify_numerical_grounding("గంటకు 2.85 కి.మీ తీవ్ర గాలులు మరియు 110 మీటర్ల సముద్ర అలల ముంపు", 110.0, 2.85) is False
    assert verify_numerical_grounding("1. Landfall Projection: Bapatla Coast with peak sustained winds of 2.85 km/h and scenario coastal surge of 110.0 meters.", 110.0, 2.85) is False

    # 8. Unassociated numbers where context cannot be established MUST BE REJECTED
    assert verify_numerical_grounding("The numbers 110 and 2.85 were recorded in the area.", 110.0, 2.85) is False



def test_gemini_mocked_success(monkeypatch):
    """
    Verifies that when Gemini API generates an operational briefing:
    1. is_live_ai is True and gemini_briefing is populated.
    2. Grounding status is verified.
    3. Deterministic authority guidance, citizen alerts, and CVI scores are strictly preserved.
    """
    mock_gt = {
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
            "hospitals_at_risk": {"in_64kt": 2},
            "roads_at_risk_km": {"in_surge_inundation": 18.4},
        },
        "cvi_rankings": [
            {"district": "Bapatla", "cvi_score": 0.82, "risk_level": "Extreme", "action_code": "IMMEDIATE_MANDATORY_EVACUATION"},
        ],
    }

    mock_briefing_text = (
        "Operational briefing: Cyclone Michaung is tracking toward Bapatla Coast with peak winds of 110 km/h "
        "and storm surge of 2.85 m. Bapatla exhibits critical vulnerability (CVI: 0.82)."
    )

    monkeypatch.setattr(advisory_engine, "_call_gemini", lambda prompt: (mock_briefing_text, None))

    adv = advisory_engine.generate_advisory(mock_gt)

    assert adv["is_live_ai"] is True
    assert adv["ai_provider"] == "GOOGLE_AI_STUDIO_GEMINI"
    assert adv["model"] == "gemini-2.5-flash"
    assert adv["gemini_briefing"] == mock_briefing_text
    assert adv["grounding_status"] == "VERIFIED_NUMERICAL_MATCH"
    assert adv["grounding_integrity_verified"] is True
    assert adv["fallback_reason"] is None

    # Crucial assertion: Gemini text DOES NOT override deterministic directives or CVI rankings
    assert "IMMEDIATE MANDATORY COASTAL EVACUATION" in adv["authority_guidance_en"]
    assert "తుఫాను" in adv["citizen_advisory_te"]
    assert adv["metrics_cited"]["highest_cvi_score"] == 0.82
    assert adv["metrics_cited"]["district_risk_level"] == "Extreme"


def test_gemini_mocked_failure_fallback(monkeypatch):
    """Verifies graceful fallback to deterministic synthesis when Gemini generation fails or times out."""
    mock_gt = {
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
        "cvi_rankings": [
            {"district": "Bapatla", "cvi_score": 0.82, "risk_level": "Extreme", "action_code": "IMMEDIATE_MANDATORY_EVACUATION"},
        ],
    }

    # Simulate Gemini timeout or quota exhaustion
    monkeypatch.setattr(
        advisory_engine,
        "_call_gemini",
        lambda prompt: (None, "REQUEST_TIMEOUT"),
    )

    adv = advisory_engine.generate_advisory(mock_gt)

    assert adv["is_live_ai"] is False
    assert adv["gemini_briefing"] is None
    assert adv["fallback_reason"] == "REQUEST_TIMEOUT"
    assert adv["grounding_status"] == "DETERMINISTIC_GROUNDED_VERIFIED"
    assert "IMMEDIATE MANDATORY COASTAL EVACUATION" in adv["authority_guidance_en"]
    assert "Bapatla" in adv["authority_guidance_en"]


def test_gemini_unconfigured_api_key_fallback(monkeypatch):
    """Verifies that missing GEMINI_API_KEY defaults cleanly to deterministic rule engine without errors."""
    mock_gt = {
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
        "cvi_rankings": [
            {"district": "Bapatla", "cvi_score": 0.82, "risk_level": "Extreme", "action_code": "IMMEDIATE_MANDATORY_EVACUATION"},
        ],
    }

    monkeypatch.setattr(advisory_engine, "api_key", "")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    adv = advisory_engine.generate_advisory(mock_gt)

    assert adv["is_live_ai"] is False
    assert adv["gemini_briefing"] is None
    assert adv["fallback_reason"] == "GEMINI_API_KEY_NOT_CONFIGURED"
    assert adv["grounding_status"] == "DETERMINISTIC_GROUNDED_VERIFIED"
    assert "IMMEDIATE MANDATORY COASTAL EVACUATION" in adv["authority_guidance_en"]
